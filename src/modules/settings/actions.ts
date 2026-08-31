"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import { updateOrganization, updateUser } from "./service";
import { updateOrganizationSchema, updateUserSchema } from "./validation";
import type { Result } from "@/lib/result";

export async function updateOrganizationSettingsAction(
  form: FormData
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.organization) {
    return { ok: false, error: "Authentification requise." };
  }
  try {
    const parsed = updateOrganizationSchema.parse({
      name: form.get("name"),
      slogan: form.get("slogan") || null,
      city: form.get("city") || null,
      currency: form.get("currency") || "KMF",
      country: form.get("country") || "KM",
    });
    const res = await updateOrganization(ctx, parsed);
    if (res.ok) revalidatePath("/app/organisation");
    if (res.ok) revalidatePath("/app/parametres");
    return res;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Données invalides." };
  }
}

export async function updateUserSettingsAction(
  form: FormData
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx) return { ok: false, error: "Authentification requise." };
  try {
    const parsed = updateUserSchema.parse({
      fullName: form.get("fullName"),
      phone: form.get("phone") || null,
    });
    const res = await updateUser(ctx, parsed);
    if (res.ok) revalidatePath("/app/parametres");
    return res;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Données invalides." };
  }
}
