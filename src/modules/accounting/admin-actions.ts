"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import { createFiscalYear, setFiscalYearStatus, createReversingEntry } from "./service";
import type { Result } from "@/lib/result";

export async function createFiscalYearAction(payload: { startDate: string; endDate: string }): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) return { ok: false, error: "Authentification requise." };
  if (!payload.startDate || !payload.endDate) return { ok: false, error: "Dates requises." };
  const res = await createFiscalYear(ctx, payload.startDate, payload.endDate);
  if (res.ok) revalidatePath("/app/comptabilite");
  return res;
}

export async function setFiscalYearStatusAction(id: string, status: string): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) return { ok: false, error: "Authentification requise." };
  const res = await setFiscalYearStatus(ctx, id, status);
  if (res.ok) revalidatePath("/app/comptabilite");
  return res;
}

export async function reverseEntryAction(entryId: string): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) return { ok: false, error: "Authentification requise." };
  const res = await createReversingEntry(ctx, entryId);
  if (res.ok) revalidatePath("/app/comptabilite");
  return res;
}
