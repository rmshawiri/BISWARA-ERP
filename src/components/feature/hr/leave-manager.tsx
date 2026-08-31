"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CalendarPlus, Check, X } from "lucide-react";
import { createLeaveRequestAction, decideLeaveAction } from "@/modules/hr/leave-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LeaveManager({
  employees,
  leaves,
}: {
  employees: { id: string; label: string }[];
  leaves: { id: string; employeeName: string; type: string; startDate: string; endDate: string; days: number; status: string }[];
}) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = React.useState("");
  const [type, setType] = React.useState("annual");
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const [days, setDays] = React.useState("1");

  function create() {
    createLeaveRequestAction({ employeeId, type, startDate: start, endDate: end, days: Number(days) || 1 }).then((res) => {
      if (res.ok) {
        toast.success("Demande de congé créée");
        setEmployeeId(""); setStart(""); setEnd("");
      } else toast.error(res.error ?? "Erreur");
      router.refresh();
    });
  }

  function decide(id: string, decision: "approved" | "rejected") {
    decideLeaveAction(id, decision).then((res) => {
      if (res.ok) router.refresh();
      else toast.error(res.error ?? "Erreur");
    });
  }

  const statusBadge: Record<string, "secondary" | "success" | "destructive" | "info"> = {
    pending: "info",
    approved: "success",
    rejected: "destructive",
  };

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarPlus className="h-4 w-4" /> Congés</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-6">
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">Employé</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Employé" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="annual">Annuel</SelectItem>
                <SelectItem value="sick">Maladie</SelectItem>
                <SelectItem value="personal">Personnel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Début</Label>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Fin</Label>
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Jours</Label>
            <Input type="number" value={days} onChange={(e) => setDays(e.target.value)} className="h-8 text-xs" />
          </div>
        </div>
        <Button size="sm" className="w-full sm:w-auto" disabled={!employeeId || !start || !end} onClick={create}>
          Demander un congé
        </Button>

        <div className="space-y-2">
          {leaves.length === 0 && <p className="text-sm text-muted-foreground">Aucune demande.</p>}
          {leaves.map((l) => (
            <div key={l.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-2 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{l.employeeName}</p>
                <p className="text-xs text-muted-foreground">{l.type} · {l.startDate} → {l.endDate} · {l.days} j</p>
              </div>
              <Badge variant={statusBadge[l.status] ?? "secondary"}>{l.status}</Badge>
              {l.status === "pending" && (
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => decide(l.id, "approved")} aria-label="Approuver"><Check className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => decide(l.id, "rejected")} aria-label="Rejeter"><X className="h-3.5 w-3.5" /></Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
