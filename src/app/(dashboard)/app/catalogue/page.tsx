import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthzContext } from "@/server/auth";
import { listProducts, listCategories, listUnits, listTaxes, listBrands } from "@/modules/catalog";
import type { Product, ProductCategory, Unit, Tax, Brand } from "@/db/schema";
import { NewProductButton } from "@/components/feature/catalog/new-product-button";
import { Referentials } from "@/components/feature/catalog/referentials";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Catalogue Produits & Services" };

export default async function CataloguePage() {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin) redirect("/login");

  const currency = ctx.organization?.currency ?? "KMF";
  let products: Product[] = [];
  let categories: ProductCategory[] = [];
  let units: Unit[] = [];
  let taxes: Tax[] = [];
  let brands: Brand[] = [];
  let dbReady = true;

  try {
    const p = await listProducts(ctx);
    if (p.ok) products = p.data;
    const c = await listCategories(ctx);
    if (c.ok) categories = c.data;
    const u = await listUnits(ctx);
    if (u.ok) units = u.data;
    const t = await listTaxes(ctx);
    if (t.ok) taxes = t.data;
    const b = await listBrands(ctx);
    if (b.ok) brands = b.data;
  } catch {
    dbReady = false;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Catalogue Produits & Services</h1>
          <p className="text-muted-foreground">
            Gérez vos produits, services, catégories et tarifs.
          </p>
        </div>
        <NewProductButton />
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

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Produits</CardTitle>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Aucun produit"
                description="Ajoutez votre premier produit ou service depuis le bouton Nouveau produit."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                      <th className="pb-2 pr-4">Nom</th>
                      <th className="pb-2 pr-4">Référence</th>
                      <th className="pb-2 pr-4">Prix</th>
                      <th className="pb-2">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium">{p.name}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{p.reference}</td>
                        <td className="py-3 pr-4">
                          {formatCurrency(Number(p.salePrice), currency)}
                        </td>
                        <td className="py-3">
                          {p.isService ? (
                            <Badge variant="info">Service</Badge>
                          ) : (
                            <Badge variant="secondary">Produit</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Catégories</CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune catégorie.</p>
            ) : (
              <ul className="space-y-2">
                {categories.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
                  >
                    {c.name}
                    <Badge variant="secondary">{c.sortOrder}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Referentials
        units={units.map((u) => ({ id: u.id, name: u.name, symbol: u.symbol }))}
        taxes={taxes.map((t) => ({ id: t.id, name: t.name, rate: Number(t.rate) }))}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
      />
    </div>
  );
}
