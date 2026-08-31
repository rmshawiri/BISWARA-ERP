import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthzContext } from "@/server/auth";
import { db } from "@/db";
import { salesDocuments, products, customers, payments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { stockLevels } from "@/modules/stock";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

export const metadata: Metadata = { title: "Rapports & Indicateurs" };

export default async function RapportsPage() {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) redirect("/login");
  const orgId = ctx.organization.id;
  const currency = ctx.organization.currency;

  const data = {
    revenue: 0,
    orders: 0,
    products: 0,
    customers: 0,
    collected: 0,
    stockValue: 0,
    lowStock: 0,
  };
  try {
    const [paid, orders, prods, custs, levels] = await Promise.all([
      db().select({ total: salesDocuments.total }).from(salesDocuments)
        .where(and(eq(salesDocuments.organizationId, orgId), eq(salesDocuments.status, "paid"))),
      db().select({ id: salesDocuments.id }).from(salesDocuments)
        .where(and(eq(salesDocuments.organizationId, orgId), eq(salesDocuments.type, "order"))),
      db().select({ id: products.id }).from(products).where(eq(products.organizationId, orgId)),
      db().select({ id: customers.id }).from(customers).where(eq(customers.organizationId, orgId)),
      stockLevels(ctx),
    ]);
    data.revenue = paid.reduce((s, r) => s + Number(r.total), 0);
    data.orders = orders.length;
    data.products = prods.length;
    data.customers = custs.length;
    const levelByProduct = new Map((levels.ok ? levels.data : []).map((l) => [l.productId, l.qty]));
    const prodsFull = await db().select({ id: products.id, salePrice: products.salePrice }).from(products).where(eq(products.organizationId, orgId));
    data.stockValue = prodsFull.reduce((s, p) => s + Number(p.salePrice) * (levelByProduct.get(p.id) ?? 0), 0);
    data.lowStock = [...levelByProduct.values()].filter((q) => q <= 10).length;
    const pays = await db().select({ amount: payments.amount }).from(payments).where(eq(payments.organizationId, orgId));
    data.collected = pays.reduce((s, p) => s + Number(p.amount), 0);
  } catch {
    // garde-fou
  }

  const kpis = [
    { label: "Chiffre d'affaires facturé", value: formatCurrency(data.revenue, currency) },
    { label: "Commandes", value: String(data.orders) },
    { label: "Produits", value: String(data.products) },
    { label: "Clients", value: String(data.customers) },
    { label: "Valeur du stock", value: formatCurrency(data.stockValue, currency) },
    { label: "Produits en stock faible (≤10)", value: String(data.lowStock) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Rapports & Indicateurs</h1>
          <p className="text-muted-foreground">Vue consolidée de votre activité.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{k.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Détail des indicateurs</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {kpis.map((k) => (
                <tr key={k.label} className="border-b last:border-0">
                  <td className="py-2 pr-4">{k.label}</td>
                  <td className="py-2 text-right font-semibold tabular-nums">{k.value}</td>
                </tr>
              ))}
              <tr>
                <td className="py-2 pr-4">Stock valorisé (moy.)</td>
                <td className="py-2 text-right"><Badge variant="secondary">{data.stockValue.toLocaleString("fr-FR")} {currency}</Badge></td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
