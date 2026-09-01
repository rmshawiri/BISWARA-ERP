"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import { requestSelfLeave, requestSalaryAdvance } from "./service";
import type { Result } from "@/lib/result";

export async function requestSelfLeaveAction(payload: {
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  notes?: string;
}): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization)
    return { ok: false, error: "Authentification requise." };
  if (!payload.startDate || !payload.endDate)
    return { ok: false, error: "Dates requises." };
  const res = await requestSelfLeave(ctx, {
    type: payload.type || "annual",
    startDate: payload.startDate,
    endDate: payload.endDate,
    days: payload.days || 1,
    notes: payload.notes || null,
  });
  if (res.ok) revalidatePath("/app/portail");
  return res;
}

export async function requestSalaryAdvanceAction(payload: {
  amount: number;
  reason?: string;
}): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization)
    return { ok: false, error: "Authentification requise." };
  const res = await requestSalaryAdvance(ctx, { amount: payload.amount ?? 0, reason: payload.reason });
  if (res.ok) revalidatePath("/app/portail");
  return res;
}
