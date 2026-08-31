"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createFiscalYearAction, setFiscalYearStatusAction } from "@/modules/accounting/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FiscalYearsManager({
  years,
}: {
  years: { id: string; startDate: string | null; endDate: string | null; status: string }[];
}) {
  const router = useRouter();
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");

  function add() {
    if (!start || !end) return toast.error("Dates requises.");
    createFiscalYearAction({ startDate: start, endDate: end }).then((res) => {
      if (res.ok) { toast.success("Exercice créé"); setStart(""); setEnd(""); }
      else toast.error(res.error ?? "Erreur");
      router.refresh();
    });
  }

  function toggle(id: string, status: string) {
    setFiscalYearStatusAction(id, status).then((res) => {
      if (res.ok) router.refresh();
      else toast.error(res.error ?? "Erreur");
    });
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Exercices comptables</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="h-8 w-40" />
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="h-8 w-40" />
          <Button size="sm" variant="outline" onClick={add}><Plus className="mr-1 h-3.5 w-3.5" /> Ouvrir</Button>
        </div>
        {years.length === 0 && <p className="text-sm text-muted-foreground">Aucun exercice.</p>}
        <div className="space-y-2">
          {years.map((y) => (
            <div key={y.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
              <span>{y.startDate ?? "—"} → {y.endDate ?? "—"}</span>
              <div className="flex items-center gap-2">
                <Badge variant={y.status === "open" ? "success" : "secondary"}>{y.status}</Badge>
                {y.status === "open" ? (
                  <Button size="sm" variant="outline" onClick={() => toggle(y.id, "closed")}>Clôturer</Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => toggle(y.id, "open")}>Réouvrir</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
