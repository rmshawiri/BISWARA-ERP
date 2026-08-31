"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import { createSalesDocument, updateDocumentStatus, recordPayment, convertDocument } from "./service";
import { createSalesDocumentSchema } from "./validation";
import type { Result } from "@/lib/result";

export interface SalesLinePayload {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
}

export interface CreateSalesDocumentPayload {
  type: "quote" | "order" | "delivery" | "invoice" | "credit_note";
  customerId?: string;
  date?: string;
  validUntil?: string;
  dueDate?: string;
  discount?: number;
  notes?: string;
  lines: SalesLinePayload[];
}

export async function createSalesDocumentAction(
  payload: CreateSalesDocumentPayload
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) {
    return { ok: false, error: "Authentification requise." };
  }

  if (!Array.isArray(payload.lines) || payload.lines.length === 0) {
    return { ok: false, error: "Ajoutez au moins une ligne au document." };
  }

  try {
    const parsed = createSalesDocumentSchema.parse({
      organizationId: ctx.organization.id,
      type: payload.type,
      customerId: payload.customerId || null,
      date: payload.date,
      validUntil: payload.validUntil || null,
      dueDate: payload.dueDate || null,
      discount: payload.discount ?? 0,
      notes: payload.notes || null,
      lines: payload.lines.map((l) => ({
        productId: l.productId || null,
        description: l.description,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        taxRate: Number(l.taxRate ?? 0),
      })),
    });
    const res = await createSalesDocument(ctx, parsed);
    if (res.ok) revalidatePath("/app/ventes");
    return res;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Données invalides." };
  }
}

export async function updateDocumentStatusAction(
  id: string,
  status: string
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization)
    return { ok: false, error: "Authentification requise." };
  const res = await updateDocumentStatus(ctx, id, status);
  if (res.ok) revalidatePath("/app/ventes");
  return res;
}

export async function recordPaymentAction(payload: {
  documentId: string;
  amount: number;
  method: string;
  reference?: string | null;
}): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization)
    return { ok: false, error: "Authentification requise." };
  if (!(payload.amount > 0)) return { ok: false, error: "Montant invalide." };
  const res = await recordPayment(ctx, payload);
  if (res.ok) revalidatePath("/app/ventes");
  return res;
}

export async function convertDocumentAction(
  id: string,
  toType: string
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization)
    return { ok: false, error: "Authentification requise." };
  const res = await convertDocument(ctx, id, toType);
  if (res.ok) revalidatePath("/app/ventes");
  return res;
}
