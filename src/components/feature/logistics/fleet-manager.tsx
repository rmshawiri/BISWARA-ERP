"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createDriverAction, createRouteAction, createFuelLogAction, createMaintenanceAction, createIncidentAction } from "@/modules/logistics/fleet-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export function FleetManager({
  drivers,
  routes,
  fuelLogs,
  maintenance,
  incidents,
  vehicles,
  currency,
}: {
  drivers: { id: string; name: string; phone: string | null; license: string | null }[];
  routes: { id: string; name: string; routeDate: string | null; origin: string | null; destination: string | null; driverId: string | null }[];
  fuelLogs: { id: string; liters: number; cost: number; odometer: number | null; vehicleId: string | null }[];
  maintenance: { id: string; type: string | null; cost: number; vehicleId: string | null }[];
  incidents: { id: string; type: string | null; description: string | null; vehicleId: string | null }[];
  vehicles: { id: string; label: string }[];
  currency: string;
}) {
  const router = useRouter();
  const [tab, setTab] = React.useState<"drivers" | "routes" | "fuel" | "maintenance" | "incidents">("drivers");

  function run(label: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    fn().then((res) => {
      if (res.ok) { toast.success(label); router.refresh(); }
      else toast.error(res.error ?? "Erreur");
    });
  }

  const driverMap = new Map(drivers.map((d) => [d.id, d.name]));
  const vehicleMap = new Map(vehicles.map((v) => [v.label, v.id]));

  const tabs: { key: typeof tab; label: string; count: number }[] = [
    { key: "drivers", label: "Chauffeurs", count: drivers.length },
    { key: "routes", label: "Tournées", count: routes.length },
    { key: "fuel", label: "Carburant", count: fuelLogs.length },
    { key: "maintenance", label: "Maintenance", count: maintenance.length },
    { key: "incidents", label: "Incidents", count: incidents.length },
  ];

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle className="flex items-center gap-2 text-base">Flotte</CardTitle>
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${tab === t.key ? "border-primary bg-primary/10" : "hover:bg-muted"}`}>
              {t.label} ({t.count})
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {tab === "drivers" && (
          <div className="space-y-2">
            <Button size="sm" variant="outline" onClick={() => { const name = prompt("Nom du chauffeur"); if (!name) return; const phone = prompt("Téléphone") || undefined; const license = prompt("Permis") || undefined; run("Chauffeur ajouté", () => createDriverAction({ name, phone: phone ?? null, license: license ?? null })); }}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter un chauffeur
            </Button>
            {drivers.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                <span className="font-medium">{d.name}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {d.phone && <span>{d.phone}</span>}
                  {d.license && <Badge variant="secondary">{d.license}</Badge>}
                </span>
              </div>
            ))}
          </div>
        )}
        {tab === "routes" && (
          <div className="space-y-2">
            <Button size="sm" variant="outline" onClick={() => { const name = prompt("Nom de la tournée"); if (!name) return; const routeDate = prompt("Date (YYYY-MM-DD)") || undefined; const origin = prompt("Départ") || undefined; const destination = prompt("Destination") || undefined; const veh = prompt("Véhicule (plaque)") || ""; const drv = prompt("Chauffeur (nom)") || ""; run("Tournée créée", () => createRouteAction({ name, routeDate: routeDate ?? null, origin: origin ?? null, destination: destination ?? null, vehicleId: vehicleMap.get(veh) ?? null, driverId: driverMap.get(drv) ?? null })); }}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Créer une tournée
            </Button>
            {routes.map((r) => (
              <div key={r.id} className="rounded-lg border p-2 text-sm">
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.routeDate ?? "—"} · {r.origin ?? "?"} → {r.destination ?? "?"} · Chauffeur : {r.driverId ? driverMap.get(r.driverId) ?? "—" : "—"}</p>
              </div>
            ))}
          </div>
        )}
        {tab === "fuel" && (
          <div className="space-y-2">
            <Button size="sm" variant="outline" onClick={() => { const veh = prompt("Véhicule (plaque)") || ""; const liters = Number(prompt("Litres") ?? 0); const cost = Number(prompt("Coût (KMF)") ?? 0); const odometer = Number(prompt("Compteur (optionnel)") ?? 0) || undefined; run("Relevé ajouté", () => createFuelLogAction({ vehicleId: vehicleMap.get(veh) ?? null, liters, cost, odometer: odometer ?? null })); }}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Relevé carburant
            </Button>
            {fuelLogs.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                <span>{f.liters} L</span>
                <span className="font-semibold tabular-nums">{formatCurrency(f.cost, currency)}</span>
              </div>
            ))}
          </div>
        )}
        {tab === "maintenance" && (
          <div className="space-y-2">
            <Button size="sm" variant="outline" onClick={() => { const veh = prompt("Véhicule (plaque)") || ""; const type = prompt("Type") || undefined; const cost = Number(prompt("Coût (KMF)") ?? 0); const description = prompt("Description") || undefined; run("Maintenance ajoutée", () => createMaintenanceAction({ vehicleId: vehicleMap.get(veh) ?? null, type: type ?? null, cost, description: description ?? null })); }}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Maintenance
            </Button>
            {maintenance.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                <span>{m.type ?? "Maintenance"}</span>
                <span className="font-semibold tabular-nums">{formatCurrency(m.cost, currency)}</span>
              </div>
            ))}
          </div>
        )}
        {tab === "incidents" && (
          <div className="space-y-2">
            <Button size="sm" variant="outline" onClick={() => { const veh = prompt("Véhicule (plaque)") || ""; const type = prompt("Type") || undefined; const description = prompt("Description") || undefined; run("Incident ajouté", () => createIncidentAction({ vehicleId: vehicleMap.get(veh) ?? null, type: type ?? null, description: description ?? null })); }}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Incident
            </Button>
            {incidents.map((i) => (
              <div key={i.id} className="rounded-lg border p-2 text-sm">
                <p className="font-medium">{i.type ?? "Incident"}</p>
                {i.description && <p className="text-xs text-muted-foreground">{i.description}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
