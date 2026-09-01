import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { salesDocuments, salesDocumentLines, customers, organizations } from "@/db/schema";
import { getAuthzContext } from "@/server/auth";
import { generateSalesDocumentPdf } from "@/engines/document";

/**
 * GET /api/documents/sales/[id] — télécharge le PDF d'un document commercial
 * (devis / bon de commande / bon de livraison / facture / avoir).
 * Utilise le Document Engine (moteur unique). Respecte l'isolation org.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const orgId = ctx.organization.id;

  try {
    const [doc] = await db()
      .select()
      .from(salesDocuments)
      .where(and(eq(salesDocuments.id, id), eq(salesDocuments.organizationId, orgId)))
      .limit(1);
    if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

    const lines = await db()
      .select()
      .from(salesDocumentLines)
      .where(eq(salesDocumentLines.documentId, id));

    const [customer] = doc.customerId
      ? await db().select().from(customers).where(eq(customers.id, doc.customerId)).limit(1)
      : [null];

    const [org] = await db().select().from(organizations).where(eq(organizations.id, orgId)).limit(1);

    const buffer = await generateSalesDocumentPdf({
      docNumber: doc.number,
      date: doc.date ?? new Date().toISOString().slice(0, 10),
      type: doc.type,
      dueDate: doc.dueDate,
      customer: {
        company: customer?.company ?? null,
        name: customer?.lastname ?? "Client",
        address: customer?.city ?? null,
      },
      company: { name: org?.name ?? "BISWARA", email: null, phone: null, nif: null },
      lines: lines.map((l) => ({
        description: l.description,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        taxRate: Number(l.taxRate),
        lineTotal: Number(l.lineTotal),
      })),
      subtotal: Number(doc.subtotal),
      taxTotal: Number(doc.taxTotal),
      discount: Number(doc.discount),
      total: Number(doc.total),
      currency: org?.currency ?? "KMF",
      notes: doc.notes,
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${doc.number}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[api/documents/sales] Erreur:", e);
    return NextResponse.json({ error: "Génération du document impossible." }, { status: 500 });
  }
}
