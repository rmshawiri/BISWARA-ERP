import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthzContext } from "@/server/auth";
import { listProducts } from "@/modules/catalog";
import {
  listWarehouses,
  listMovements,
  stockLevels,
} from "@/modules/stock";
import type { Product, StockMovement, Warehouse } from "@/db/schema";
import { NewStockMovementButton, type MovementOption } from "@/components/feature/stock/new-stock-movement-button";
import { NewWarehouseButton } from "@/components/feature/stock/new-warehouse-button";
import { TransferButton } from "@/components/feature/stock/transfer-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Boxes, Package, Warehouse as WarehouseIcon } from "lucide-react";

export const metadata: Metadata = { title: "Stock & Inventaire" };

const MOVEMENT_LABELS: Record<string, string> = {
  in: "Entrée",
  out: "Sortie",
  transfer: "Transfert",
  adjust: "Ajustement",
  inventory: "Inventaire",
};

const LOW_STOCK_THRESHOLD = 10;

function fmtQty(qty: number): string {
  return qty.toLocaleString("fr-FR");
}

export default async function StockPage() {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin) redirect("/login");

  let products: Product[] = [];
  let warehouses: Warehouse[] = [];
  let movements: StockMovement[] = [];
  let levels: { productId: string; qty: number }[] = [];
  let dbReady = true;

  try {
    const [p, w, m, l] = await Promise.all([
      listProducts(ctx),
      listWarehouses(ctx),
      listMovements(ctx),
      stockLevels(ctx),
    ]);
    if (p.ok) products = p.data;
    if (w.ok) warehouses = w.data;
    if (m.ok) movements = m.data;
    if (l.ok) levels = l.data;
  } catch {
    dbReady = false;
  }

  const productById = new Map(products.map((p) => [p.id, p]));
  const levelByProduct = new Map(levels.map((l) => [l.productId, l.qty]));

  const movementOptions: MovementOption[] = products.map((p) => ({
    id: p.id,
    label: p.reference ? `${p.name} (${p.reference})` : p.name,
  }));
  const warehouseOptions: MovementOption[] = warehouses.map((w) => ({
    id: w.id,
    label: w.code ? `${w.name} (${w.code})` : w.name,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Stock &amp; Inventaire</h1>
          <p className="text-muted-foreground">
            Suivez vos niveaux de stock, mouvements et dépôts.
          </p>
        </div>
        <div className="flex gap-2">
          <NewStockMovementButton
            products={movementOptions}
            warehouses={warehouseOptions}
          />
          <NewWarehouseButton />
          <TransferButton products={movementOptions} warehouses={warehouseOptions} />
        </div>
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

      {/* Niveaux de stock */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Niveaux de stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
              <Boxes className="h-10 w-10 opacity-40" />
              <p className="text-sm">
                Aucun produit en stock. Ajoutez des produits depuis le
                catalogue puis enregistrez vos mouvements.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="pb-2 pr-4">Produit</th>
                    <th className="pb-2 pr-4">Référence</th>
                    <th className="pb-2 pr-4">Quantité</th>
                    <th className="pb-2">État</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const qty = levelByProduct.get(p.id) ?? 0;
                    const low = qty <= LOW_STOCK_THRESHOLD;
                    return (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium">{p.name}</td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {p.reference}
                        </td>
                        <td className="py-3 pr-4 font-semibold tabular-nums">
                          {fmtQty(qty)}
                        </td>
                        <td className="py-3">
                          {low ? (
                            <Badge variant="warning">Stock faible</Badge>
                          ) : (
                            <Badge variant="success">En stock</Badge>
                          )}
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Mouvements */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Mouvements récents</CardTitle>
          </CardHeader>
          <CardContent>
            {movements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun mouvement pour le moment.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                      <th className="pb-2 pr-4">Date</th>
                      <th className="pb-2 pr-4">Produit</th>
                      <th className="pb-2 pr-4">Type</th>
                      <th className="pb-2 pr-4">Qté</th>
                      <th className="pb-2">Réf.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((mv) => (
                      <tr key={mv.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 text-muted-foreground">
                          {mv.date ?? "—"}
                        </td>
                        <td className="py-3 pr-4 font-medium">
                          {productById.get(mv.productId)?.name ?? "—"}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant="secondary">
                            {MOVEMENT_LABELS[mv.type] ?? mv.type}
                          </Badge>
                        </td>
                        <td
                          className={`py-3 pr-4 font-semibold tabular-nums ${
                            mv.type === "out" ? "text-rose-400" : "text-emerald-400"
                          }`}
                        >
                          {mv.type === "out" ? "−" : "+"}
                          {fmtQty(Number(mv.quantity))}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {mv.reference ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dépôts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <WarehouseIcon className="h-4 w-4" />
              Dépôts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {warehouses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun dépôt configuré.
              </p>
            ) : (
              <ul className="space-y-2">
                {warehouses.map((w) => (
                  <li
                    key={w.id}
                    className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{w.name}</span>
                    {w.code && (
                      <Badge variant="secondary">{w.code}</Badge>
                    )}
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
