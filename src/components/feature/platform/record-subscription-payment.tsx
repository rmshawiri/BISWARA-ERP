"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { recordSubscriptionPaymentAction } from "@/modules/platform/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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

interface OrgRef {
  id: string;
  name: string;
  plan: string;
}

const METHODS = [
  { value: "cash", label: "Espèces" },
  { value: "mvola", label: "Mvola" },
  { value: "holo", label: "Holo" },
  { value: "wakati", label: "Wakati" },
  { value: "bank", label: "Virement" },
  { value: "check", label: "Chèque" },
  { value: "card", label: "Carte" },
];

export function RecordSubscriptionPaymentButton({ orgs }: { orgs: OrgRef[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [orgId, setOrgId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [method, setMethod] = React.useState("cash");
  const [reference, setReference] = React.useState("");
  const [note, setNote] = React.useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) return toast.error("Choisissez une organisation.");
    startTransition(async () => {
      const res = await recordSubscriptionPaymentAction(orgId, {
        amount: Number(amount),
        method,
        reference: reference || undefined,
        note: note || undefined,
      });
      if (res.ok) {
        toast.success("Paiement enregistré.");
        setOpen(false);
        setAmount(""); setReference(""); setNote(""); setOrgId("");
      } else {
        toast.error(res.error ?? "Erreur");
      }
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-3.5 w-3.5" /> Enregistrer un paiement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Enregistrer un paiement d&apos;abonnement</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label>Organisation</Label>
            <Select value={orgId} onValueChange={setOrgId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir…" />
              </SelectTrigger>
              <SelectContent>
                {orgs.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name} ({o.plan})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Montant (KMF)</Label>
              <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Moyen</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Référence</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Note</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
