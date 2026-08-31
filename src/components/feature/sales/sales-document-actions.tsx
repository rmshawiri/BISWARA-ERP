"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ArrowRight, CreditCard, MoreHorizontal } from "lucide-react";
import {
  updateDocumentStatusAction,
  recordPaymentAction,
  convertDocumentAction,
} from "@/modules/sales/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES = [
  { value: "draft", label: "Brouillon" },
  { value: "sent", label: "Envoyé" },
  { value: "accepted", label: "Accepté" },
  { value: "validated", label: "Validé" },
  { value: "paid", label: "Payé" },
  { value: "cancelled", label: "Annulé" },
];

const CONVERT: Record<string, { to: string; label: string } | undefined> = {
  quote: { to: "order", label: "Convertir en commande" },
  order: { to: "invoice", label: "Convertir en facture" },
};

const METHODS = ["cash", "mvola", "holo", "wakati", "bank", "check", "card"];

export function SalesDocumentActions({
  id,
  type,
  status,
}: {
  id: string;
  type: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [payOpen, setPayOpen] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  const [method, setMethod] = React.useState("cash");

  function run(label: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(label);
        router.refresh();
      } else toast.error(res.error ?? "Erreur");
    });
  }

  const convert = CONVERT[type];

  const nextStatuses = STATUSES.filter((s) => s.value !== status);

  function submitPayment() {
    const amt = Number(amount);
    if (!(amt > 0)) return toast.error("Montant invalide.");
    setPayOpen(false);
    run("Paiement enregistré", () =>
      recordPaymentAction({ documentId: id, amount: amt, method })
    );
    setAmount("");
  }

  return (
    <div className="flex items-center gap-1">
      {type === "invoice" && (
        <Dialog open={payOpen} onOpenChange={setPayOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Enregistrer un paiement">
              <CreditCard className="h-3.5 w-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Enregistrer un paiement</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Montant (KMF)</Label>
                <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Mode</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={submitPayment} disabled={pending}>Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Actions">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Statut</DropdownMenuLabel>
          {nextStatuses.map((s) => (
            <DropdownMenuItem
              key={s.value}
              onClick={() => run("Statut mis à jour", () => updateDocumentStatusAction(id, s.value))}
            >
              {s.label}
            </DropdownMenuItem>
          ))}
          {convert && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => run(convert.label, () => convertDocumentAction(id, convert.to))}
              >
                <ArrowRight className="mr-1 h-3.5 w-3.5" />
                {convert.label}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
