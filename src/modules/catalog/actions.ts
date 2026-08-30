"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import {
  createProduct,
  createCategory,
  deactivateProduct,
} from "./service";
import { createProductSchema, createCategorySchema } from "./validation";
import type { Result } from "@/lib/result";

export async function createProductAction(
  form: FormData
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) {
    return { ok: false, error: "Authentification requise." };
  }
  let parsed;
  try {
    // L'organisation est injectée depuis l'utilisateur connecté (sécurité).
    parsed = createProductSchema.parse({
      organizationId: ctx.organization.id,
      name: form.get("name"),
      reference: form.get("reference"),
      barcode: form.get("barcode") || null,
      categoryId: form.get("categoryId") || null,
      brandId: form.get("brandId") || null,
      unitId: form.get("unitId") || null,
      taxId: form.get("taxId") || null,
      description: form.get("description") || null,
      purchasePrice: Number(form.get("purchasePrice") ?? 0),
      salePrice: Number(form.get("salePrice") ?? 0),
      wholesalePrice: form.get("wholesalePrice")
        ? Number(form.get("wholesalePrice"))
        : null,
      isService: form.get("isService") === "on",
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Données invalides." };
  }
  const res = await createProduct(ctx, parsed);
  if (res.ok) revalidatePath("/app/catalogue");
  return res;
}

export async function createCategoryAction(
  form: FormData
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) {
    return { ok: false, error: "Authentification requise." };
  }
  try {
    const parsed = createCategorySchema.parse({
      organizationId: ctx.organization.id,
      name: form.get("name"),
      description: form.get("description") || null,
    });
    const res = await createCategory(ctx, parsed);
    if (res.ok) revalidatePath("/app/catalogue");
    return res;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Données invalides." };
  }
}

export async function deactivateProductAction(
  id: string
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) {
    return { ok: false, error: "Authentification requise." };
  }
  const res = await deactivateProduct(ctx, id);
  if (res.ok) revalidatePath("/app/catalogue");
  return res;
}
