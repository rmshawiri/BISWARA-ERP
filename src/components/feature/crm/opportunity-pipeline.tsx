"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createOpportunityAction, updateOpportunityStageAction } from "@/modules/crm/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

const STAGES = ["prospect", "qualified", "proposal", "negotiation", "won", "lost"];

export function OpportunityPipeline({
  opportunities,
  customers,
  currency,
}: {
  opportunities: { id: string; title: string; value: number; stage: string; customerName: string }[];
  customers: { id: string; label: string }[];
  currency: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [customerId, setCustomerId] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [value, setValue] = React.useState("");
  const [stage, setStage] = React.useState("prospect");

  function move(id: string, st: string, status?: string) {
    startTransition(async () => {
      const res = await updateOpportunityStageAction(id, st, status);
      if (res.ok) router.refresh();
      else toast.error(res.error ?? "Erreur");
    });
  }

  function create(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || !title.trim()) return toast.error("Client et titre requis.");
    startTransition(async () => {
      const res = await createOpportunityAction({
        customerId,
        title: title.trim(),
        value: Number(value) || 0,
        stage,
      });
      if (res.ok) {
        toast.success("Opportunité créée");
        setOpen(false);
        setTitle("");
        setValue("");
        setCustomerId("");
      } else toast.error(res.error ?? "Erreur");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Pipeline commercial</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-3.5 w-3.5" /> Opportunité
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Nouvelle opportunité</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-3">
              <div className="space-y-1">
                <Label>Client</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger><SelectValue placeholder="Choisir un client" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Titre</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Valeur ({currency})</Label>
                <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Étape</Label>
                <Select value={stage} onValueChange={setStage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={pending}>Créer</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {STAGES.map((st) => {
          const items = opportunities.filter((o) => o.stage === st);
          return (
            <div key={st} className="rounded-xl border p-2.5">
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                {st} ({items.length})
              </p>
              <div className="space-y-2">
                {items.length === 0 && (
                  <p className="text-xs text-muted-foreground">—</p>
                )}
                {items.map((o) => (
                  <div key={o.id} className="rounded-lg border bg-muted/30 p-2">
                    <p className="truncate text-sm font-medium">{o.title}</p>
                    <p className="text-xs text-muted-foreground">{o.customerName}</p>
                    <p className="text-xs font-semibold">{formatCurrency(o.value, currency)}</p>
                    <select
                      className="mt-1 w-full rounded border bg-background px-1 py-0.5 text-xs"
                      value={o.stage}
                      onChange={(e) => move(o.id, e.target.value, e.target.value === "won" || e.target.value === "lost" ? "closed" : "open")}
                    >
                      {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
