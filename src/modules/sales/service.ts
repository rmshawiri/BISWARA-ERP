import "server-only";

import { eq, and, like, sql } from "drizzle-orm";
import { db } from "@/db";
import { salesDocuments, salesDocumentLines } from "@/db/schema";
import type { AuthzContext } from "@/types";
import { hasPermission } from "@/server/rbac";
import { logAudit } from "@/engines/audit";
import { MODULES, type PermissionAction } from "@/lib/constants";
import { err, ok, Result } from "@/lib/result";
import { buildDocumentNumber } from "@/lib/numbering";
import {
  CreateSalesDocumentInput,
  computeTotals,
  type ComputedTotals,
} from "./validation";

const PREFIX: Record<string, string> = {
  quote: "DEV",
  order: "CMD",
  delivery: "BL",
  invoice: "FAC",
  credit_note: "AV",
};

function requirePerm(ctx: AuthzContext, action: PermissionAction): void {
  if (!hasPermission(ctx, MODULES.SALES, action)) {
    throw new Error("Vous n'êtes pas autorisé à effectuer cette action.");
  }
}

/** Récupère la prochaine séquence d'un préfixe pour l'organisation. */
async function nextSequence(
  organizationId: string,
  prefix: string,
  year: number
): Promise<number> {
  const [row] = await db()
    .select({ c: sql<number>`count(*)::int` })
    .from(salesDocuments)
    .where(
      and(
        eq(salesDocuments.organizationId, organizationId),
        like(salesDocuments.number, `${prefix}-${year}-%`)
      )
    );
  return (Number(row?.c ?? 0) + 1);
}

/** Crée un document commercial (devis/commande/facture) + ses lignes. */
export async function createSalesDocument(
  ctx: AuthzContext,
  input: CreateSalesDocumentInput
): Promise<Result<{ document: typeof salesDocuments.$inferSelect; totals: ComputedTotals }>> {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  const year = new Date().getFullYear();
  const prefix = PREFIX[input.type] ?? "DOC";

  try {
    const seq = await nextSequence(orgId, prefix, year);
    const number = buildDocumentNumber({ prefix, year, seq });
    const totals = computeTotals(input.lines, input.discount);

    const [document] = await db()
      .insert(salesDocuments)
      .values({
        organizationId: orgId,
        customerId: input.customerId ?? null,
        type: input.type,
        number,
        date: input.date ?? new Date().toISOString().slice(0, 10),
        validUntil: input.validUntil ?? null,
        status: "draft",
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        discount: totals.discount,
        total: totals.total,
        dueDate: input.dueDate ?? null,
        notes: input.notes ?? null,
      })
      .returning();
    if (!document) return err("Création impossible.");

    await db()
      .insert(salesDocumentLines)
      .values(
        input.lines.map((l, i) => ({
          documentId: document.id,
          productId: l.productId ?? null,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate,
          lineTotal: l.quantity * l.unitPrice,
          sortOrder: i,
        }))
      );

    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.SALES,
      action: `${input.type}.create`,
      entityType: input.type,
      entityId: document.id,
      newValue: { number, total: totals.total },
    });

    return ok({ document, totals });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

/** Liste les documents d'un type pour l'organisation. */
export async function listDocuments(
  ctx: AuthzContext,
  type: string
): Promise<Result<typeof salesDocuments.$inferSelect[]>> {
  requirePerm(ctx, "view");
  const orgId = ctx.organization!.id;
  try {
    const result = await db()
      .select()
      .from(salesDocuments)
      .where(and(eq(salesDocuments.organizationId, orgId), eq(salesDocuments.type, type)))
      .orderBy(salesDocuments.createdAt);
    return ok(result);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}
