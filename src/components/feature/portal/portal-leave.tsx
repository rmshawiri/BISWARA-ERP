"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { requestSelfLeaveAction } from "@/modules/portal/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PortalLeave({
  leaves,
}: {
  leaves: { id: string; type: string; startDate: string; endDate: string; days: number; status: string }[];
}) {
  const router = useRouter();
  const [type, setType] = React.useState("annual");
  const [start, setStart] = React.useState("");
  const [end, setEnd] = React.useState("");
  const [days, setDays] = React.useState("1");

  function submit() {
    requestSelfLeaveAction({ type, startDate: start, endDate: end, days: Number(days) || 1 }).then((res) => {
      if (res.ok) {
        toast.success("Demande envoyée");
        setStart(""); setEnd("");
      } else toast.error(res.error ?? "Erreur");
      router.refresh();
    });
  }

  const badge: Record<string, "info" | "success" | "destructive"> = {
    pending: "info",
    approved: "success",
    rejected: "destructive",
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-5">
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
          <Label className="text-xs">Du</Label>
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Au</Label>
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Jours</Label>
          <Input type="number" value={days} onChange={(e) => setDays(e.target.value)} className="h-8 text-xs" />
        </div>
        <div className="flex items-end">
          <Button size="sm" className="w-full" disabled={!start || !end} onClick={submit}>
            <CalendarPlus className="mr-1 h-3.5 w-3.5" /> Demander
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {leaves.length === 0 && <p className="text-sm text-muted-foreground">Aucune demande de congé.</p>}
        {leaves.map((l) => (
          <div key={l.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
            <span>{l.type} · {l.startDate} → {l.endDate} · {l.days} j</span>
            <Badge variant={badge[l.status] ?? "secondary"}>{l.status}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
