"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import { recordTransfer } from "./service";
import type { Result } from "@/lib/result";

export async function recordTransferAction(payload: {
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
}): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization)
    return { ok: false, error: "Authentification requise." };
  if (!(payload.quantity > 0)) return { ok: false, error: "Quantité invalide." };
  if (payload.fromWarehouseId === payload.toWarehouseId)
    return { ok: false, error: "Dépôts identiques." };
  const res = await recordTransfer(ctx, payload);
  if (res.ok) revalidatePath("/app/stock");
  return res;
}
