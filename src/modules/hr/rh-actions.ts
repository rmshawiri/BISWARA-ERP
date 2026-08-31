"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import { createContract, recordAttendance, generatePayroll, setPayrollStatus } from "./service";
import type { Result } from "@/lib/result";

export async function createContractAction(payload: { employeeId: string; contractType: string; startDate?: string; endDate?: string; baseSalary: number }): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) return { ok: false, error: "Authentification requise." };
  if (!payload.employeeId) return { ok: false, error: "Employé requis." };
  const res = await createContract(ctx, { employeeId: payload.employeeId, contractType: payload.contractType || "cdi", startDate: payload.startDate || null, endDate: payload.endDate || null, baseSalary: payload.baseSalary || 0 });
  if (res.ok) revalidatePath("/app/rh");
  return res;
}

export async function recordAttendanceAction(payload: { employeeId: string; workDate: string; status: string }): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) return { ok: false, error: "Authentification requise." };
  if (!payload.employeeId || !payload.workDate) return { ok: false, error: "Employé et date requis." };
  const res = await recordAttendance(ctx, { employeeId: payload.employeeId, workDate: payload.workDate, status: payload.status || "present" });
  if (res.ok) revalidatePath("/app/rh");
  return res;
}

export async function generatePayrollAction(payload: { employeeId: string; period: string; baseSalary: number; bonus?: number; deductions?: number }): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) return { ok: false, error: "Authentification requise." };
  if (!payload.employeeId || !payload.period) return { ok: false, error: "Employé et période requis." };
  const res = await generatePayroll(ctx, { employeeId: payload.employeeId, period: payload.period, baseSalary: payload.baseSalary || 0, bonus: payload.bonus ?? 0, deductions: payload.deductions ?? 0 });
  if (res.ok) revalidatePath("/app/rh");
  return res;
}

export async function setPayrollStatusAction(id: string, status: string): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) return { ok: false, error: "Authentification requise." };
  const res = await setPayrollStatus(ctx, id, status);
  if (res.ok) revalidatePath("/app/rh");
  return res;
}
