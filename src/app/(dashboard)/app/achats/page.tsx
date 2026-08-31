import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthzContext } from "@/server/auth";
import { listSuppliers, listPurchaseDocuments } from "@/modules/purchasing";
import type { Supplier, PurchaseDocument } from "@/db/schema";
import { NewSupplierButton } from "@/components/feature/purchasing/new-supplier-button";
import { NewPurchaseDocumentButton } from "@/components/feature/purchasing/new-purchase-document-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Truck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Achats & Fournisseurs" };

const DOC_LABELS: Record<string, string> = {
  request: "Demande d'achat",
  order: "Bon de commande",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  pending: "En attente",
  validated: "Validé",
  rejected: "Rejeté",
  received: "Reçu",
  paid: "Payé",
};

export default async function AchatsPage() {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin) redirect("/login");

  let suppliers: Supplier[] = [];
  const documents: PurchaseDocument[] = [];
  let dbReady = true;

  try {
    const [s, req, ord] = await Promise.all([
      listSuppliers(ctx),
      listPurchaseDocuments(ctx, "request"),
      listPurchaseDocuments(ctx, "order"),
    ]);
    if (s.ok) suppliers = s.data;
    if (req.ok) documents.push(...req.data);
    if (ord.ok) documents.push(...ord.data);
    documents.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  } catch {
    dbReady = false;
  }

  const currency = ctx.organization?.currency ?? "KMF";
  const supplierById = new Map(suppliers.map((s) => [s.id, s]));
  const supplierOptions = suppliers.map((s) => ({
    id: s.id,
    label: s.reference ? `${s.name} (${s.reference})` : s.name,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Achats &amp; Fournisseurs</h1>
          <p className="text-muted-foreground">
            Fournisseurs, demandes d'achat et bons de commande.
          </p>
        </div>
        <div className="flex gap-2">
          <NewPurchaseDocumentButton suppliers={supplierOptions} />
          <NewSupplierButton />
        </div>
      </div>

      {!dbReady && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Les tables métier ne sont pas encore disponibles. Appliquez la
            migration <code>0004_sprint3.sql</code> dans Supabase pour activer
            ce module.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Documents */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingBag className="h-4 w-4" />
              Documents d'achat
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun document d'achat.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                      <th className="pb-2 pr-4">Numéro</th>
                      <th className="pb-2 pr-4">Fournisseur</th>
                      <th className="pb-2 pr-4">Type</th>
                      <th className="pb-2 pr-4">Statut</th>
                      <th className="pb-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((d) => (
                      <tr key={d.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium tabular-nums">{d.number}</td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {supplierById.get(d.supplierId)?.name ?? "—"}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant="secondary">{DOC_LABELS[d.type] ?? d.type}</Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={d.status === "validated" || d.status === "paid" ? "success" : d.status === "pending" ? "info" : d.status === "rejected" ? "destructive" : "secondary"}>
                            {STATUS_LABELS[d.status] ?? d.status}
                          </Badge>
                        </td>
                        <td className="py-3 font-semibold tabular-nums">
                          {formatCurrency(Number(d.total), currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fournisseurs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-4 w-4" />
              Fournisseurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {suppliers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun fournisseur.</p>
            ) : (
              <ul className="space-y-2">
                {suppliers.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{s.name}</span>
                    {s.reference && <Badge variant="secondary">{s.reference}</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
