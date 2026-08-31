import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthzContext } from "@/server/auth";
import { listVehicles, listDeliveries } from "@/modules/logistics";
import type { Vehicle, Delivery } from "@/db/schema";
import { NewVehicleButton, NewDeliveryButton } from "@/components/feature/logistics/logistics-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin } from "lucide-react";

export const metadata: Metadata = { title: "Logistique & Transport" };

const DELIVERY_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  in_transit: "En route",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const DELIVERY_STATUS_BADGE: Record<string, "info" | "success" | "destructive"> = {
  pending: "info",
  in_transit: "info",
  delivered: "success",
  cancelled: "destructive",
};

export default async function LogistiquePage() {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin) redirect("/login");

  let vehicles: Vehicle[] = [];
  let deliveries: Delivery[] = [];
  let dbReady = true;
  try {
    const [v, d] = await Promise.all([listVehicles(ctx), listDeliveries(ctx)]);
    if (v.ok) vehicles = v.data;
    if (d.ok) deliveries = d.data;
  } catch {
    dbReady = false;
  }

  const vehicleById = new Map(vehicles.map((x) => [x.id, x]));
  const vehicleOptions = vehicles.map((x) => ({ id: x.id, label: x.plate }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Logistique &amp; Transport</h1>
          <p className="text-muted-foreground">Livraisons, tournées et véhicules.</p>
        </div>
        <div className="flex gap-2">
          <NewDeliveryButton vehicles={vehicleOptions} />
          <NewVehicleButton />
        </div>
      </div>

      {!dbReady && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Les tables métier ne sont pas encore disponibles. Appliquez la
            migration <code>0008_logistics.sql</code> dans Supabase pour activer
            ce module.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><MapPin className="h-4 w-4" />Livraisons</CardTitle>
          </CardHeader>
          <CardContent>
            {deliveries.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune livraison.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                      <th className="pb-2 pr-4">Réf.</th>
                      <th className="pb-2 pr-4">Client</th>
                      <th className="pb-2 pr-4">Véhicule</th>
                      <th className="pb-2 pr-4">Trajet</th>
                      <th className="pb-2">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((d) => (
                      <tr key={d.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium">{d.reference ?? "—"}</td>
                        <td className="py-3 pr-4">{d.customerName ?? "—"}</td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {d.vehicleId ? vehicleById.get(d.vehicleId)?.plate ?? "—" : "—"}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {d.origin ?? "—"} → {d.destination ?? "—"}
                        </td>
                        <td className="py-3">
                          <Badge variant={DELIVERY_STATUS_BADGE[d.status] ?? "secondary"}>
                            {DELIVERY_STATUS_LABELS[d.status] ?? d.status}
                          </Badge>
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
            <CardTitle className="flex items-center gap-2 text-base"><Truck className="h-4 w-4" />Véhicules</CardTitle>
          </CardHeader>
          <CardContent>
            {vehicles.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun véhicule.</p>
            ) : (
              <ul className="space-y-2">
                {vehicles.map((v) => (
                  <li key={v.id} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
                    <span className="font-medium">{v.plate}</span>
                    <span className="text-xs text-muted-foreground">{v.model ?? "—"}</span>
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
