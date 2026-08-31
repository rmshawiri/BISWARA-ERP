"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import { createCustomer, updateCustomer, deactivateCustomer, createOpportunity, updateOpportunityStage } from "./service";
import { createCustomerSchema, updateCustomerSchema } from "./validation";
import type { Result } from "@/lib/result";

export async function createCustomerAction(
  form: FormData
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) {
    return { ok: false, error: "Authentification requise." };
  }
  try {
    const parsed = createCustomerSchema.parse({
      organizationId: ctx.organization.id,
      type: form.get("type") || "customer",
      company: form.get("company") || null,
      firstname: form.get("firstname") || null,
      lastname: form.get("lastname") || "",
      email: form.get("email") || "",
      phone: form.get("phone") || null,
      notes: form.get("notes") || null,
    });
    const res = await createCustomer(ctx, parsed);
    if (res.ok) revalidatePath("/app/crm");
    return res;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Données invalides." };
  }
}

export async function deactivateCustomerAction(
  id: string
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) {
    return { ok: false, error: "Authentification requise." };
  }
  const res = await deactivateCustomer(ctx, id);
  if (res.ok) revalidatePath("/app/crm");
  return res;
}

export async function updateCustomerAction(
  id: string,
  form: FormData
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) {
    return { ok: false, error: "Authentification requise." };
  }
  try {
    const parsed = updateCustomerSchema.parse({
      type: form.get("type") || undefined,
      company: form.get("company") || undefined,
      firstname: form.get("firstname") || undefined,
      lastname: form.get("lastname") || undefined,
      email: form.get("email") || undefined,
      phone: form.get("phone") || undefined,
      city: form.get("city") || undefined,
      country: form.get("country") || undefined,
      sector: form.get("sector") || undefined,
      notes: form.get("notes") || undefined,
    });
    const res = await updateCustomer(ctx, id, parsed);
    if (res.ok) revalidatePath("/app/crm");
    return res;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Données invalides." };
  }
}

export async function createOpportunityAction(payload: {
  customerId: string;
  title: string;
  value: number;
  stage?: string;
}): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization)
    return { ok: false, error: "Authentification requise." };
  const res = await createOpportunity(ctx, {
    customerId: payload.customerId,
    title: payload.title,
    value: payload.value,
    stage: payload.stage ?? "prospect",
  });
  if (res.ok) revalidatePath("/app/crm");
  return res;
}

export async function updateOpportunityStageAction(
  id: string,
  stage: string,
  status?: string
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization)
    return { ok: false, error: "Authentification requise." };
  const res = await updateOpportunityStage(ctx, id, stage, status);
  if (res.ok) revalidatePath("/app/crm");
  return res;
}
