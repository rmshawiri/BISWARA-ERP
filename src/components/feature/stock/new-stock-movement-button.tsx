"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ArrowDownUp, Plus } from "lucide-react";
import { createStockMovementAction } from "@/modules/stock/actions";
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

export interface MovementOption {
  id: string;
  label: string;
}

const TYPES: { value: string; label: string }[] = [
  { value: "in", label: "Entrée" },
  { value: "out", label: "Sortie" },
  { value: "transfer", label: "Transfert" },
  { value: "adjust", label: "Ajustement" },
  { value: "inventory", label: "Inventaire" },
];

export function NewStockMovementButton({
  products,
  warehouses,
}: {
  products: MovementOption[];
  warehouses: MovementOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [productId, setProductId] = React.useState("");
  const [type, setType] = React.useState("in");
  const [warehouseId, setWarehouseId] = React.useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!productId) {
      toast.error("Sélectionnez un produit.");
      return;
    }
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("productId", productId);
    formData.set("type", type);
    formData.set("warehouseId", warehouseId || "");
    const res = await createStockMovementAction(formData);
    setLoading(false);
    if (res.ok) {
      toast.success("Mouvement enregistré");
      setOpen(false);
      setProductId("");
      setWarehouseId("");
      setType("in");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setProductId("");
          setWarehouseId("");
          setType("in");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2">
          <ArrowDownUp className="h-4 w-4" />
          Nouveau mouvement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enregistrer un mouvement de stock</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Type de mouvement" />
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
              <Label>Produit</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un produit" />
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                step="0.001"
                min="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Dépôt (optionnel)</Label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les dépôts" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Référence</Label>
              <Input id="reference" name="reference" placeholder="BL-2026-0001" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" placeholder="Observation (optionnel)" />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              <Plus className="h-4 w-4" />
              {loading ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
