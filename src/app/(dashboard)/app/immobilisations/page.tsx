import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthzContext } from "@/server/auth";
import { requireModuleAccess } from "@/server/module-gate";
import { MODULES } from "@/lib/constants";
import { listAssets, amortizationFor } from "@/modules/assets";
import type { Asset } from "@/db/schema";
import { NewAssetButton } from "@/components/feature/assets/new-asset-button";
import { DisposeAssetButton } from "@/components/feature/assets/dispose-asset-button";
import { DepreciationButton } from "@/components/feature/assets/depreciation-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Landmark } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Immobilisations" };

const CATEGORY_LABELS: Record<string, string> = {
  equipment: "Équipement",
  vehicle: "Véhicule",
  building: "Bâtiment",
  furniture: "Mobilier",
  computer: "Informatique",
  other: "Autre",
};

const METHOD_LABELS: Record<string, string> = {
  linear: "Linéaire",
  declining: "Dégressif",
  custom: "Personnalisé",
};

export default async function ImmobilisationsPage() {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin) redirect("/login");
  await requireModuleAccess(ctx, MODULES.ASSETS);

  let assets: Asset[] = [];
  let dbReady = true;
  try {
    const res = await listAssets(ctx);
    if (res.ok) assets = res.data;
  } catch {
    dbReady = false;
  }

  const currency = ctx.organization?.currency ?? "KMF";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Immobilisations</h1>
          <p className="text-muted-foreground">
            Gestion des actifs et de leur amortissement.
          </p>
        </div>
        <NewAssetButton />
      </div>

      {!dbReady && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Les tables métier ne sont pas encore disponibles. Appliquez la
            migration <code>0005_assets.sql</code> dans Supabase pour activer ce
            module.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Landmark className="h-4 w-4" />
            Actifs ({assets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun actif enregistré. Ajoutez votre première immobilisation.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="pb-2 pr-4">Nom</th>
                    <th className="pb-2 pr-4">Catégorie</th>
                    <th className="pb-2 pr-4">Coût</th>
                    <th className="pb-2 pr-4">Amort./an</th>
                    <th className="pb-2 pr-4">Méthode</th>
                    <th className="pb-2 pr-4">Statut</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((a) => {
                    const amort = amortizationFor(a);
                    return (
                      <tr key={a.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium">{a.name}</td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {CATEGORY_LABELS[a.category] ?? a.category}
                        </td>
                        <td className="py-3 pr-4 font-semibold tabular-nums">
                          {formatCurrency(Number(a.cost), currency)}
                        </td>
                        <td className="py-3 pr-4 tabular-nums">
                          {formatCurrency(amort.annual, currency)}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant="secondary">{METHOD_LABELS[a.method] ?? a.method}</Badge>
                        </td>
                        <td className="py-3">
                          <Badge variant={a.status === "active" ? "success" : "warning"}>
                            {a.status === "active" ? "En service" : a.status}
                          </Badge>
                        </td>
                        <td className="py-3">
                          {a.status === "active" && (
                            <div className="flex gap-1">
                              <DepreciationButton id={a.id} />
                              <DisposeAssetButton id={a.id} />
                            </div>
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
    </div>
  );
}
