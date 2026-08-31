"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import { createWarehouse, createStockMovement } from "./service";
import { createWarehouseSchema, createStockMovementSchema } from "./validation";
import type { Result } from "@/lib/result";

export async function createWarehouseAction(
  form: FormData
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) {
    return { ok: false, error: "Authentification requise." };
  }
  try {
    const parsed = createWarehouseSchema.parse({
      organizationId: ctx.organization.id,
      name: form.get("name"),
      code: form.get("code") || null,
      address: form.get("address") || null,
    });
    const res = await createWarehouse(ctx, parsed);
    if (res.ok) revalidatePath("/app/stock");
    return res;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Données invalides." };
  }
}

export async function createStockMovementAction(
  form: FormData
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) {
    return { ok: false, error: "Authentification requise." };
  }
  try {
    const parsed = createStockMovementSchema.parse({
      organizationId: ctx.organization.id,
      productId: form.get("productId"),
      warehouseId: form.get("warehouseId") || null,
      type: form.get("type"),
      quantity: form.get("quantity"),
      reference: form.get("reference") || null,
      date: (form.get("date") as string) || new Date().toISOString().slice(0, 10),
      notes: form.get("notes") || null,
    });
    const res = await createStockMovement(ctx, parsed);
    if (res.ok) revalidatePath("/app/stock");
    return res;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Données invalides." };
  }
}
