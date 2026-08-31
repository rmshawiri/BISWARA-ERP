"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import { receivePurchase, decidePurchaseValidation } from "./service";
import type { Result } from "@/lib/result";

export async function receivePurchaseAction(
  documentId: string
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization)
    return { ok: false, error: "Authentification requise." };
  const res = await receivePurchase(ctx, documentId);
  if (res.ok) revalidatePath("/app/achats");
  return res;
}

export async function decidePurchaseAction(
  documentId: string,
  decision: "approved" | "rejected"
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization)
    return { ok: false, error: "Authentification requise." };
  const res = await decidePurchaseValidation(ctx, documentId, decision);
  if (res.ok) revalidatePath("/app/achats");
  return res;
}
