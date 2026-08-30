"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import { createCustomer, updateCustomer, deactivateCustomer } from "./service";
import { createCustomerSchema } from "./validation";
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

export { updateCustomer };
