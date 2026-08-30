import "server-only";

import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import {
  suppliers,
  purchaseDocuments,
  purchaseDocumentLines,
  purchaseValidations,
} from "@/db/schema";
import type { AuthzContext } from "@/types";
import { hasPermission } from "@/server/rbac";
import { logAudit } from "@/engines/audit";
import {
  resolveWorkflowStep,
  requiresApproval,
  type ApprovalResult,
  type WorkflowStep,
} from "@/engines/workflow";
import { MODULES, type PermissionAction } from "@/lib/constants";
import { err, ok, Result } from "@/lib/result";

function requirePerm(ctx: AuthzContext, action: PermissionAction): void {
  if (!hasPermission(ctx, MODULES.PURCHASES, action)) {
    throw new Error("Vous n'êtes pas autorisé à effectuer cette action.");
  }
}

export async function createSupplier(
  ctx: AuthzContext,
  input: { name: string; reference?: string | null; contact?: string | null; phone?: string | null; email?: string | null }
): Promise<Result<typeof suppliers.$inferSelect>> {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db()
      .insert(suppliers)
      .values({ ...input, organizationId: orgId })
      .returning();
    if (!row) return err("Création impossible.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.PURCHASES,
      action: "supplier.create",
      entityType: "supplier",
      entityId: row.id,
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

export async function listSuppliers(
  ctx: AuthzContext
): Promise<Result<typeof suppliers.$inferSelect[]>> {
  requirePerm(ctx, "view");
  try {
    const result = await db()
      .select()
      .from(suppliers)
      .where(eq(suppliers.organizationId, ctx.organization!.id));
    return ok(result);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/**
 * Crée un document d'achat et détermine le workflow d'approbation
 * en fonction du montant total (via le Workflow Engine).
 */
export async function createPurchaseDocument(
  ctx: AuthzContext,
  input: {
    supplierId: string;
    type: "request" | "order";
    date?: string | null;
    lines: { description: string; quantity: number; unitPrice: number }[];
    steps: WorkflowStep[];
  }
): Promise<Result<{ document: typeof purchaseDocuments.$inferSelect; approval: ApprovalResult }>> {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;

  const total = input.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const approval = resolveWorkflowStep(total, input.steps);
  const status = requiresApproval(total) && approval.decision === "pending" ? "pending" : "draft";

  try {
    const year = new Date().getFullYear();
    const number = `ACH-${year}-${Date.now().toString().slice(-6)}`;

    const [document] = await db()
      .insert(purchaseDocuments)
      .values({
        organizationId: orgId,
        supplierId: input.supplierId,
        type: input.type,
        number,
        date: input.date ?? new Date().toISOString().slice(0, 10),
        status,
        total,
      })
      .returning();
    if (!document) return err("Création impossible.");

    await db()
      .insert(purchaseDocumentLines)
      .values(
        input.lines.map((l) => ({
          documentId: document.id,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          lineTotal: l.quantity * l.unitPrice,
        }))
      );

    if (approval.step) {
      await db().insert(purchaseValidations).values({
        documentId: document.id,
        step: approval.step.label,
        role: approval.step.role,
        decision: approval.decision === "approved" ? "approved" : null,
      });
    }

    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.PURCHASES,
      action: `purchase.${input.type}`,
      entityType: "purchase_document",
      entityId: document.id,
      newValue: { number, total, status },
    });

    return ok({ document, approval });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

/** Liste des documents d'achat d'un type. */
export async function listPurchaseDocuments(
  ctx: AuthzContext,
  type: string
): Promise<Result<typeof purchaseDocuments.$inferSelect[]>> {
  requirePerm(ctx, "view");
  try {
    const result = await db()
      .select()
      .from(purchaseDocuments)
      .where(
        and(
          eq(purchaseDocuments.organizationId, ctx.organization!.id),
          eq(purchaseDocuments.type, type)
        )
      )
      .orderBy(purchaseDocuments.createdAt);
    return ok(result);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}
