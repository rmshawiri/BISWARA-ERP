"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import { createSupplier, createPurchaseDocument } from "./service";
import {
  createSupplierSchema,
  createPurchaseDocumentSchema,
} from "./validation";
import { PURCHASE_WORKFLOW_STEPS } from "./constants";
import type { PurchaseLineInput } from "./validation";
import type { Result } from "@/lib/result";

export async function createSupplierAction(
  form: FormData
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.organization) {
    return { ok: false, error: "Authentification requise." };
  }
  try {
    const parsed = createSupplierSchema.parse({
      name: form.get("name"),
      reference: form.get("reference") || null,
      contact: form.get("contact") || null,
      phone: form.get("phone") || null,
      email: form.get("email") || null,
    });
    const res = await createSupplier(ctx, parsed);
    if (res.ok) revalidatePath("/app/achats");
    return res;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Données invalides." };
  }
}

export interface CreatePurchaseDocumentPayload {
  supplierId: string;
  type: "request" | "order";
  date?: string;
  lines: PurchaseLinePayload[];
}

export interface PurchaseLinePayload {
  description: string;
  quantity: number;
  unitPrice: number;
}

export async function createPurchaseDocumentAction(
  payload: CreatePurchaseDocumentPayload
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.organization) {
    return { ok: false, error: "Authentification requise." };
  }
  if (!Array.isArray(payload.lines) || payload.lines.length === 0) {
    return { ok: false, error: "Ajoutez au moins une ligne." };
  }
  try {
    const parsed = createPurchaseDocumentSchema.parse({
      supplierId: payload.supplierId,
      type: payload.type,
      date: payload.date || null,
      lines: payload.lines.map((l) => ({
        description: l.description,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
      })),
    });
    const res = await createPurchaseDocument(ctx, {
      supplierId: parsed.supplierId,
      type: parsed.type,
      date: parsed.date,
      lines: parsed.lines as PurchaseLineInput[],
      steps: PURCHASE_WORKFLOW_STEPS,
    });
    if (res.ok) revalidatePath("/app/achats");
    return res;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Données invalides." };
  }
}
