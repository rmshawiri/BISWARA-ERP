"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FilePlus2, Plus, Trash2 } from "lucide-react";
import { createPurchaseDocumentAction } from "@/modules/purchasing/actions";
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

interface Line {
  key: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

const emptyLine = (): Line => ({
  key: crypto.randomUUID(),
  description: "",
  quantity: "1",
  unitPrice: "0",
});

function num(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function NewPurchaseDocumentButton({
  suppliers,
}: {
  suppliers: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [supplierId, setSupplierId] = React.useState("");
  const [type, setType] = React.useState("request");
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = React.useState<Line[]>([emptyLine()]);

  const updateLine = (key: string, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const total = React.useMemo(
    () => lines.reduce((s, l) => s + num(l.quantity) * num(l.unitPrice), 0),
    [lines]
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supplierId) {
      toast.error("Sélectionnez un fournisseur.");
      return;
    }
    const cleaned = lines.filter((l) => l.description.trim() !== "");
    if (cleaned.length === 0) {
      toast.error("Ajoutez au moins une ligne.");
      return;
    }
    setLoading(true);
    const res = await createPurchaseDocumentAction({
      supplierId,
      type: type as "request",
      date,
      lines: cleaned.map((l) => ({
        description: l.description.trim(),
        quantity: num(l.quantity),
        unitPrice: num(l.unitPrice),
      })),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Document d'achat créé");
      setOpen(false);
      setLines([emptyLine()]);
      setSupplierId("");
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
          Nouveau document d'achat
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Créer un document d'achat</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fournisseur</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="request">Demande d'achat</SelectItem>
                  <SelectItem value="order">Bon de commande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

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
                Ajouter
              </Button>
            </div>
            {lines.map((l, i) => (
              <div key={l.key} className="grid grid-cols-1 gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_80px_110px_32px]">
                <div className="space-y-2">
                  <Label className="text-xs">Description</Label>
                  <Input
                    className="h-8 text-xs"
                    value={l.description}
                    onChange={(e) => updateLine(l.key, { description: e.target.value })}
                    placeholder="Article / service"
                  />
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
            ))}
          </div>

          <div className="flex justify-between rounded-xl border bg-muted/40 p-4 text-sm font-bold">
            <span>Total</span>
            <span className="tabular-nums">{total.toLocaleString("fr-FR")} KMF</span>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Création…" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
