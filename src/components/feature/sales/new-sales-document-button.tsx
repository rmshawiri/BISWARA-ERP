"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FilePlus2, Plus, Trash2 } from "lucide-react";
import { createSalesDocumentAction } from "@/modules/sales/actions";
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

export interface SalesOption {
  id: string;
  label: string;
  price?: number;
}

const TYPES: { value: string; label: string }[] = [
  { value: "quote", label: "Devis" },
  { value: "order", label: "Commande" },
  { value: "delivery", label: "Bon de livraison" },
  { value: "invoice", label: "Facture" },
  { value: "credit_note", label: "Avoir" },
];

interface Line {
  key: string;
  productId: string;
  description: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
}

const emptyLine = (): Line => ({
  key: crypto.randomUUID(),
  productId: "",
  description: "",
  quantity: "1",
  unitPrice: "0",
  taxRate: "0",
});

function num(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function NewSalesDocumentButton({
  products,
  customers,
}: {
  products: SalesOption[];
  customers: SalesOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [type, setType] = React.useState("quote");
  const [customerId, setCustomerId] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [discount, setDiscount] = React.useState("0");
  const [notes, setNotes] = React.useState("");
  const [lines, setLines] = React.useState<Line[]>([emptyLine()]);

  const updateLine = (key: string, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const onSelectProduct = (key: string, productId: string) => {
    const p = products.find((x) => x.id === productId);
    updateLine(key, {
      productId,
      description: p?.label ?? "",
      unitPrice: p?.price != null ? String(p.price) : "0",
    });
  };

  const totals = React.useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    for (const l of lines) {
      const lt = num(l.quantity) * num(l.unitPrice);
      subtotal += lt;
      tax += lt * (num(l.taxRate) / 100);
    }
    const total = Math.max(0, subtotal + tax - num(discount));
    return { subtotal, tax, total };
  }, [lines, discount]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cleaned = lines.filter((l) => l.description.trim() !== "");
    if (cleaned.length === 0) {
      toast.error("Ajoutez au moins une ligne avec une description.");
      return;
    }
    setLoading(true);
    const res = await createSalesDocumentAction({
      type: type as "quote",
      customerId: customerId || undefined,
      date,
      discount: num(discount),
      notes: notes || undefined,
      lines: cleaned.map((l) => ({
        productId: l.productId || undefined,
        description: l.description.trim(),
        quantity: num(l.quantity),
        unitPrice: num(l.unitPrice),
        taxRate: num(l.taxRate),
      })),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Document créé");
      setOpen(false);
      setLines([emptyLine()]);
      setCustomerId("");
      setDiscount("0");
      setNotes("");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <FilePlus2 className="h-4 w-4" />
          Nouveau document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Créer un document commercial</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-5">
          {/* En-tête */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un client" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount">Remise (KMF)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
          </div>

          {/* Lignes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Lignes</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLines((ls) => [...ls, emptyLine()])}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter une ligne
              </Button>
            </div>

            {lines.map((l, i) => (
              <div key={l.key} className="rounded-xl border p-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_90px_110px_70px_32px]">
                  <div className="space-y-2">
                    <Label className="text-xs">Produit</Label>
                    <Select
                      value={l.productId}
                      onValueChange={(v) => onSelectProduct(l.key, v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Produit / service" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Qté</Label>
                    <Input
                      className="h-8 text-xs"
                      type="number"
                      min="0"
                      step="0.01"
                      value={l.quantity}
                      onChange={(e) => updateLine(l.key, { quantity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">PU (KMF)</Label>
                    <Input
                      className="h-8 text-xs"
                      type="number"
                      min="0"
                      step="0.01"
                      value={l.unitPrice}
                      onChange={(e) => updateLine(l.key, { unitPrice: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">TVA %</Label>
                    <Input
                      className="h-8 text-xs"
                      type="number"
                      min="0"
                      step="0.01"
                      value={l.taxRate}
                      onChange={(e) => updateLine(l.key, { taxRate: e.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={lines.length === 1}
                    onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}
                    className="mt-6 grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                    aria-label={`Supprimer la ligne ${i + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 space-y-2">
                  <Label className="text-xs">Description</Label>
                  <Input
                    className="h-8 text-xs"
                    value={l.description}
                    onChange={(e) => updateLine(l.key, { description: e.target.value })}
                    placeholder="Description de la ligne"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Totaux */}
          <div className="rounded-xl border bg-muted/40 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sous-total</span>
              <span className="font-semibold tabular-nums">
                {totals.subtotal.toLocaleString("fr-FR")} KMF
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">TVA</span>
              <span className="font-semibold tabular-nums">
                +{totals.tax.toLocaleString("fr-FR")} KMF
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Remise</span>
              <span className="font-semibold tabular-nums text-rose-400">
                −{num(discount).toLocaleString("fr-FR")} KMF
              </span>
            </div>
            <div className="mt-2 flex justify-between border-t pt-2 text-base font-bold">
              <span>Total</span>
              <span className="tabular-nums">{totals.total.toLocaleString("fr-FR")} KMF</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Conditions, remarques… (optionnel)"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Création…" : "Créer le document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
