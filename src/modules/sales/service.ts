import "server-only";

import { eq, and, like, sql } from "drizzle-orm";
import { db } from "@/db";
import { salesDocuments, salesDocumentLines, payments, stockMovements, financialTransactions, accounts } from "@/db/schema";
import type { AuthzContext } from "@/types";
import { hasPermission } from "@/server/rbac";
import { logAudit } from "@/engines/audit";
import { MODULES, type PermissionAction } from "@/lib/constants";
import { err, ok, Result } from "@/lib/result";
import { buildDocumentNumber } from "@/lib/numbering";
import { allocatePayment } from "@/modules/finance/logic";
import { autoPostSalesEntry } from "@/modules/accounting";
import { notifyOrgUsers } from "@/engines/notify-org";
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

    try {
      await notifyOrgUsers(orgId, `${PREFIX[input.type] ?? "Doc"} ${number} créé`, "Un nouveau document commercial a été créé.", "/app/ventes", MODULES.SALES);
    } catch { /* non bloquant */ }

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

/** Récupère un document + ses lignes (isolé par organisation). */
export async function getDocument(
  ctx: AuthzContext,
  id: string
): Promise<Result<{ document: typeof salesDocuments.$inferSelect; lines: typeof salesDocumentLines.$inferSelect[] }>> {
  requirePerm(ctx, "view");
  const orgId = ctx.organization!.id;
  try {
    const [doc] = await db()
      .select()
      .from(salesDocuments)
      .where(and(eq(salesDocuments.id, id), eq(salesDocuments.organizationId, orgId)))
      .limit(1);
    if (!doc) return err("Document introuvable.");
    const lines = await db()
      .select()
      .from(salesDocumentLines)
      .where(eq(salesDocumentLines.documentId, id))
      .orderBy(salesDocumentLines.sortOrder);
    return ok({ document: doc, lines });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["sent", "cancelled"],
  sent: ["accepted", "cancelled"],
  accepted: ["validated", "cancelled"],
  validated: ["paid", "cancelled"],
  credit_note: [],
};

/** Change le statut d'un document (transition contrôlée). */
export async function updateDocumentStatus(
  ctx: AuthzContext,
  id: string,
  next: string
): Promise<Result<typeof salesDocuments.$inferSelect>> {
  requirePerm(ctx, "update");
  const orgId = ctx.organization!.id;
  try {
    const [doc] = await db()
      .select()
      .from(salesDocuments)
      .where(and(eq(salesDocuments.id, id), eq(salesDocuments.organizationId, orgId)))
      .limit(1);
    if (!doc) return err("Document introuvable.");
    if (doc.type === "credit_note") return err("Un avoir n'a pas de workflow de statut.");
    const allowed = VALID_TRANSITIONS[doc.status] ?? [];
    if (!allowed.includes(next)) return err(`Transition ${doc.status} → ${next} non autorisée.`);
    const [row] = await db()
      .update(salesDocuments)
      .set({ status: next })
      .where(and(eq(salesDocuments.id, id), eq(salesDocuments.organizationId, orgId)))
      .returning();
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.SALES,
      action: `document.${next}`,
      entityType: doc.type,
      entityId: id,
      newValue: { status: next },
    });
    // Génération automatique d'écriture comptable à la validation (best-effort).
    if (next === "validated" && doc.type === "invoice") {
      try {
        await autoPostSalesEntry(ctx, Number(doc.total), `Facture ${doc.number}`);
      } catch {
        // Non bloquant : la comptabilité doit être configurée pour fonctionner.
      }
    }
    // Décrément automatique du stock à la validation d'une facture (I1).
    if (next === "validated" && doc.type === "invoice") {
      try {
        const lines = await db()
          .select()
          .from(salesDocumentLines)
          .where(eq(salesDocumentLines.documentId, id));
        const date = new Date().toISOString().slice(0, 10);
        for (const l of lines) {
          if (l.productId) {
            await db().insert(stockMovements).values({
              organizationId: orgId,
              productId: l.productId,
              type: "out",
              quantity: l.quantity,
              reference: doc.number,
              date,
            });
          }
        }
      } catch {
        // Non bloquant.
      }
    }
    return ok(row!);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de changement de statut");
  }
}

/** Enregistre un paiement et met à jour le statut (payé / partiel). */
export async function recordPayment(
  ctx: AuthzContext,
  input: {
    documentId: string;
    amount: number;
    method: string;
    reference?: string | null;
    date?: string | null;
  }
): Promise<Result<{ payment: typeof payments.$inferSelect; remaining: number; status: string }>> {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [doc] = await db()
      .select()
      .from(salesDocuments)
      .where(and(eq(salesDocuments.id, input.documentId), eq(salesDocuments.organizationId, orgId)))
      .limit(1);
    if (!doc) return err("Document introuvable.");
    if (doc.type !== "invoice") return err("Seules les factures peuvent être payées.");

    const prior = await db()
      .select({ amount: payments.amount })
      .from(payments)
      .where(eq(payments.documentId, doc.id));
    const alreadyPaid = prior.reduce((s, p) => s + Number(p.amount), 0);

    const alloc = allocatePayment(input.amount, Number(doc.total), alreadyPaid);
    const newStatus = alloc.status === "paid" ? "paid" : doc.status;

    const [payment] = await db()
      .insert(payments)
      .values({
        organizationId: orgId,
        documentId: doc.id,
        customerId: doc.customerId,
        amount: input.amount,
        method: input.method,
        reference: input.reference ?? null,
        date: input.date ?? new Date().toISOString().slice(0, 10),
        status: "received",
      })
      .returning();
    if (!payment) return err("Enregistrement impossible.");

    await db()
      .update(salesDocuments)
      .set({ status: newStatus })
      .where(eq(salesDocuments.id, doc.id));

    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.SALES,
      action: "payment.create",
      entityType: "payment",
      entityId: payment.id,
      newValue: { amount: input.amount, method: input.method },
    });

    try {
      await notifyOrgUsers(orgId, `Paiement ${input.amount} ${ctx.organization?.currency ?? "KMF"}`, `Paiement reçu sur ${doc.number}.`, "/app/ventes", MODULES.SALES);
    } catch { /* non bloquant */ }

    // Encaissement -> trésorerie (best-effort, compte choisi automatiquement).
    try {
      const [acc] = await db()
        .select()
        .from(accounts)
        .where(and(eq(accounts.organizationId, orgId), eq(accounts.status, "active")))
        .orderBy(accounts.name)
        .limit(1);
      if (acc) {
        await db().insert(financialTransactions).values({
          organizationId: orgId,
          accountId: acc.id,
          direction: "in",
          amount: input.amount,
          method: input.method,
          reference: doc.number,
          date: new Date().toISOString().slice(0, 10),
          notes: `Encaissement ${doc.number}`,
        });
      }
    } catch { /* non bloquant */ }

    return ok({ payment, remaining: alloc.remaining, status: newStatus });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur d'enregistrement du paiement");
  }
}

/** Liste les paiements d'un document (ou de tous). */
export async function listPayments(
  ctx: AuthzContext,
  documentId?: string
): Promise<Result<typeof payments.$inferSelect[]>> {
  requirePerm(ctx, "view");
  const orgId = ctx.organization!.id;
  try {
    const rows = await db()
      .select()
      .from(payments)
      .where(and(eq(payments.organizationId, orgId), documentId ? eq(payments.documentId, documentId) : undefined))
      .orderBy(payments.createdAt);
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** Convertit un document en un autre type (devis→commande→facture). */
export async function convertDocument(
  ctx: AuthzContext,
  id: string,
  toType: string
): Promise<Result<typeof salesDocuments.$inferSelect>> {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [src] = await db()
      .select()
      .from(salesDocuments)
      .where(and(eq(salesDocuments.id, id), eq(salesDocuments.organizationId, orgId)))
      .limit(1);
    if (!src) return err("Document introuvable.");
    if (src.type === toType) return err("Le type est identique.");

    const year = new Date().getFullYear();
    const prefix = PREFIX[toType] ?? "DOC";
    const seq = await nextSequence(orgId, prefix, year);
    const number = buildDocumentNumber({ prefix, year, seq });

    const [doc] = await db()
      .insert(salesDocuments)
      .values({
        organizationId: orgId,
        customerId: src.customerId,
        type: toType,
        number,
        date: new Date().toISOString().slice(0, 10),
        status: "draft",
        subtotal: src.subtotal,
        taxTotal: src.taxTotal,
        discount: src.discount,
        total: src.total,
        dueDate: toType === "invoice" ? src.dueDate : null,
        notes: src.notes,
      })
      .returning();
    if (!doc) return err("Conversion impossible.");

    const lines = await db()
      .select()
      .from(salesDocumentLines)
      .where(eq(salesDocumentLines.documentId, id));
    await db()
      .insert(salesDocumentLines)
      .values(
        lines.map((l, i) => ({
          documentId: doc.id,
          productId: l.productId,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate,
          lineTotal: l.lineTotal,
          sortOrder: i,
        }))
      );

    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.SALES,
      action: `document.convert.${toType}`,
      entityType: src.type,
      entityId: id,
      newValue: { number: doc.number },
    });
    return ok(doc);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de conversion");
  }
}
