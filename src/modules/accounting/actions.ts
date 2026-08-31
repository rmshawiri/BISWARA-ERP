"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import { createJournalEntry } from "./service";
import type { Result } from "@/lib/result";

export interface JournalEntryLinePayload {
  account: string;
  label: string;
  debit: number;
  credit: number;
}

export interface CreateJournalEntryPayload {
  journalId: string;
  date: string;
  label: string;
  lines: JournalEntryLinePayload[];
}

export async function createJournalEntryAction(
  payload: CreateJournalEntryPayload
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.organization) {
    return { ok: false, error: "Authentification requise." };
  }
  if (!payload.journalId) return { ok: false, error: "Sélectionnez un journal." };
  if (!Array.isArray(payload.lines) || payload.lines.length === 0) {
    return { ok: false, error: "Ajoutez au moins une ligne." };
  }
  try {
    const res = await createJournalEntry(ctx, {
      journalId: payload.journalId,
      date: payload.date,
      label: payload.label,
      lines: payload.lines.map((l) => ({
        account: l.account,
        label: l.label,
        debit: Number(l.debit),
        credit: Number(l.credit),
      })),
    });
    if (res.ok) revalidatePath("/app/comptabilite");
    return res;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Données invalides." };
  }
}
