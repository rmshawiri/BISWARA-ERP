"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { requestSalaryAdvanceAction } from "@/modules/portal/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PortalAdvance() {
  const router = useRouter();
  const [amount, setAmount] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [pending, setPending] = React.useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Montant invalide.");
      return;
    }
    setPending(true);
    requestSalaryAdvanceAction({ amount: value, reason }).then((res) => {
      setPending(false);
      if (res.ok) {
        toast.success("Demande d'avance envoyée");
        setAmount("");
        setReason("");
        router.refresh();
      } else {
        toast.error(res.error ?? "Erreur");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Montant (devise de l'organisation)</Label>
        <Input
          type="number"
          min={1}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Ex : 150000"
          required
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Motif (optionnel)</Label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Justification de la demande…"
          rows={2}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
      <Button type="submit" size="sm" disabled={pending} className="gap-1.5">
        <Wallet className="h-3.5 w-3.5" />
        {pending ? "Envoi…" : "Demander une avance"}
      </Button>
    </form>
  );
}
