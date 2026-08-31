import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthzContext } from "@/server/auth";
import { listProducts } from "@/modules/catalog";
import { listCustomers } from "@/modules/crm";
import { listDocuments } from "@/modules/sales";
import type { Product, Customer, SalesDocument } from "@/db/schema";
import { NewSalesDocumentButton, type SalesOption } from "@/components/feature/sales/new-sales-document-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Gestion Commerciale" };

const TYPES = [
  { value: "quote", label: "Devis", badge: "info" as const },
  { value: "order", label: "Commande", badge: "default" as const },
  { value: "delivery", label: "Livraison", badge: "secondary" as const },
  { value: "invoice", label: "Facture", badge: "success" as const },
  { value: "credit_note", label: "Avoir", badge: "warning" as const },
];

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  accepted: "Accepté",
  validated: "Validé",
  cancelled: "Annulé",
  paid: "Payé",
};

const STATUS_BADGE: Record<string, "secondary" | "info" | "success" | "warning" | "default" | "destructive"> = {
  draft: "secondary",
  sent: "info",
  accepted: "success",
  validated: "success",
  cancelled: "destructive",
  paid: "success",
};

export default async function VentesPage() {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin) redirect("/login");

  let products: Product[] = [];
  let customers: Customer[] = [];
  const documents: SalesDocument[] = [];
  let dbReady = true;

  try {
    const [p, c, ...docs] = await Promise.all([
      listProducts(ctx),
      listCustomers(ctx),
      ...TYPES.map((t) => listDocuments(ctx, t.value)),
    ]);
    if (p.ok) products = p.data;
    if (c.ok) customers = c.data;
    docs.forEach((r) => {
      if (r.ok) documents.push(...r.data);
    });
    documents.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  } catch {
    dbReady = false;
  }

  const currency = ctx.organization?.currency ?? "KMF";
  const productOptions: SalesOption[] = products.map((p) => ({
    id: p.id,
    label: p.reference ? `${p.name} (${p.reference})` : p.name,
    price: Number(p.salePrice),
  }));
  const customerOptions: SalesOption[] = customers.map((c) => ({
    id: c.id,
    label: c.company ?? c.lastname,
  }));
  const customerById = new Map(customers.map((c) => [c.id, c]));

  const typeLabel = new Map(TYPES.map((t) => [t.value, t.label]));
  const typeBadge = new Map(TYPES.map((t) => [t.value, t.badge]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Gestion Commerciale</h1>
          <p className="text-muted-foreground">
            Devis, commandes, livraisons, factures et avoirs.
          </p>
        </div>
        <NewSalesDocumentButton
          products={productOptions}
          customers={customerOptions}
        />
      </div>

      {!dbReady && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Les tables métier ne sont pas encore disponibles. Appliquez la
            migration <code>0003_business.sql</code> dans Supabase pour activer
            ce module.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Documents commerciaux
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
              <FileText className="h-10 w-10 opacity-40" />
              <p className="text-sm">
                Aucun document pour le moment. Créez votre premier devis ou
                facture.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4">Numéro</th>
                    <th className="pb-2 pr-4">Client</th>
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Statut</th>
                    <th className="pb-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((d) => {
                    const customer = d.customerId ? customerById.get(d.customerId) : undefined;
                    return (
                      <tr key={d.id} className="border-b last:border-0">
                        <td className="py-3 pr-4">
                          <Badge variant={typeBadge.get(d.type)}>
                            {typeLabel.get(d.type) ?? d.type}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 font-medium tabular-nums">{d.number}</td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {customer
                            ? customer.company ?? customer.lastname
                            : "—"}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">{d.date ?? "—"}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={STATUS_BADGE[d.status] ?? "secondary"}>
                            {STATUS_LABELS[d.status] ?? d.status}
                          </Badge>
                        </td>
                        <td className="py-3 font-semibold tabular-nums">
                          {formatCurrency(Number(d.total), currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
