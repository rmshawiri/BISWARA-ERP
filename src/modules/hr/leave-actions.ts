"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import { createLeaveRequest, decideLeave } from "./service";
import type { Result } from "@/lib/result";

export async function createLeaveRequestAction(payload: {
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  notes?: string;
}): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization)
    return { ok: false, error: "Authentification requise." };
  if (!payload.employeeId || !payload.startDate || !payload.endDate)
    return { ok: false, error: "Employé et dates requis." };
  const res = await createLeaveRequest(ctx, {
    employeeId: payload.employeeId,
    type: payload.type || "annual",
    startDate: payload.startDate,
    endDate: payload.endDate,
    days: payload.days || 1,
    notes: payload.notes || null,
  });
  if (res.ok) revalidatePath("/app/rh");
  return res;
}

export async function decideLeaveAction(
  id: string,
  decision: "approved" | "rejected"
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization)
    return { ok: false, error: "Authentification requise." };
  const res = await decideLeave(ctx, id, decision);
  if (res.ok) revalidatePath("/app/rh");
  return res;
}
