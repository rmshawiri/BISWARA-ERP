"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import { createAccount, recordTransaction } from "./service";
import type { Result } from "@/lib/result";

export async function createAccountAction(
  form: FormData
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.organization) {
    return { ok: false, error: "Authentification requise." };
  }
  try {
    const type = String(form.get("type") || "cash");
    if (!["cash", "bank", "mobile_money"].includes(type)) {
      return { ok: false, error: "Type de compte invalide." };
    }
    const res = await createAccount(ctx, {
      name: String(form.get("name") || "").trim(),
      type,
      currency: String(form.get("currency") || "KMF"),
      openingBalance: Number(form.get("openingBalance") ?? 0),
    });
    if (res.ok) revalidatePath("/app/finance");
    return res;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Données invalides." };
  }
}

export interface RecordTransactionPayload {
  accountId: string;
  direction: "in" | "out" | "transfer";
  amount: number;
  method: string;
  reference?: string;
  date?: string;
  notes?: string;
}

export async function recordTransactionAction(
  payload: RecordTransactionPayload
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.organization) {
    return { ok: false, error: "Authentification requise." };
  }
  if (!payload.accountId) return { ok: false, error: "Sélectionnez un compte." };
  if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
    return { ok: false, error: "Montant invalide." };
  }
  try {
    const res = await recordTransaction(ctx, {
      accountId: payload.accountId,
      direction: payload.direction,
      amount: Number(payload.amount),
      method: payload.method || "cash",
      reference: payload.reference || null,
      date: payload.date || null,
      notes: payload.notes || null,
    });
    if (res.ok) revalidatePath("/app/finance");
    return res;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Données invalides." };
  }
}
