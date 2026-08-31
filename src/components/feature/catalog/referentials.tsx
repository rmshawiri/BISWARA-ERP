"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createUnitAction, createTaxAction, createBrandAction } from "@/modules/catalog/referential-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

function AddRow({
  names,
  onAdd,
}: {
  names: { name: string; symbol?: string };
  onAdd: (name: string, symbol?: string) => void;
}) {
  const [name, setName] = React.useState("");
  const [symbol, setSymbol] = React.useState("");
  return (
    <div className="flex flex-wrap items-end gap-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={names.name} className="h-8 w-40" />
      {names.symbol && <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder={names.symbol} className="h-8 w-20" />}
      <Button size="sm" variant="outline" onClick={() => { onAdd(name, symbol || undefined); setName(""); setSymbol(""); }}>
        <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter
      </Button>
    </div>
  );
}

export function Referentials({
  units,
  taxes,
  brands,
}: {
  units: { id: string; name: string; symbol: string | null }[];
  taxes: { id: string; name: string; rate: number }[];
  brands: { id: string; name: string }[];
}) {
  const router = useRouter();
  function run(label: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    fn().then((res) => {
      if (res.ok) { toast.success(label); router.refresh(); }
      else toast.error(res.error ?? "Erreur");
    });
  }
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader><CardTitle className="text-base">Unités</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <AddRow names={{ name: "Nom (ex : Unité)", symbol: "Symbole" }} onAdd={(n, s) => { const fd = new FormData(); fd.set("name", n); if (s) fd.set("symbol", s); run("Unité ajoutée", () => createUnitAction(fd)); }} />
          {units.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
              <span>{u.name}</span>
              <Badge variant="secondary">{u.symbol ?? "—"}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Taxes</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <AddRow names={{ name: "Nom (ex : TVA 20%)" }} onAdd={(n) => { const fd = new FormData(); fd.set("name", n); fd.set("rate", "20"); run("Taxe ajoutée", () => createTaxAction(fd)); }} />
          {taxes.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
              <span>{t.name}</span>
              <Badge variant="secondary">{t.rate}%</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Marques</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <AddRow names={{ name: "Nom (ex : Marque)" }} onAdd={(n) => { const fd = new FormData(); fd.set("name", n); run("Marque ajoutée", () => createBrandAction(fd)); }} />
          {brands.map((b) => (
            <div key={b.id} className="rounded-lg border p-2 text-sm">{b.name}</div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
