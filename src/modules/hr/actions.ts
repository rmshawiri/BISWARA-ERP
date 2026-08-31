"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import { createEmployee } from "./service";
import type { Result } from "@/lib/result";

export async function createEmployeeAction(
  form: FormData
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.organization) {
    return { ok: false, error: "Authentification requise." };
  }
  const firstName = String(form.get("firstName") || "").trim();
  const lastName = String(form.get("lastName") || "").trim();
  if (!firstName || !lastName) {
    return { ok: false, error: "Prénom et nom requis." };
  }
  try {
    const res = await createEmployee(ctx, {
      firstName,
      lastName,
      email: form.get("email") ? String(form.get("email")) : null,
      phone: form.get("phone") ? String(form.get("phone")) : null,
      position: form.get("position") ? String(form.get("position")) : null,
      department: form.get("department") ? String(form.get("department")) : null,
      hireDate: form.get("hireDate") ? String(form.get("hireDate")) : null,
      annualLeaveDays: Number(form.get("annualLeaveDays") ?? 30),
    });
    if (res.ok) revalidatePath("/app/rh");
    return res;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Données invalides." };
  }
}
