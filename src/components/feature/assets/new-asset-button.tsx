"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, Landmark } from "lucide-react";
import { createAssetAction } from "@/modules/assets/actions";
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

const CATEGORIES = [
  { value: "equipment", label: "Équipement" },
  { value: "vehicle", label: "Véhicule" },
  { value: "building", label: "Bâtiment" },
  { value: "furniture", label: "Mobilier" },
  { value: "computer", label: "Informatique" },
  { value: "other", label: "Autre" },
];

const METHODS = [
  { value: "linear", label: "Linéaire" },
  { value: "declining", label: "Dégressif" },
];

export function NewAssetButton() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [category, setCategory] = React.useState("equipment");
  const [method, setMethod] = React.useState("linear");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("category", category);
    fd.set("method", method);
    const res = await createAssetAction(fd);
    setLoading(false);
    if (res.ok) {
      toast.success("Actif créé");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Landmark className="h-4 w-4" />
          Nouvel actif
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un actif</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Méthode</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reference">Référence</Label>
              <Input id="reference" name="reference" placeholder="ACT-001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acquisitionDate">Date d'acquisition</Label>
              <Input id="acquisitionDate" name="acquisitionDate" type="date" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Coût (KMF)</Label>
              <Input id="cost" name="cost" type="number" min="0" step="0.01" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="residualValue">Valeur résiduelle</Label>
              <Input id="residualValue" name="residualValue" type="number" min="0" step="0.01" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="usefulLife">Durée de vie (ans)</Label>
              <Input id="usefulLife" name="usefulLife" type="number" min="1" step="0.5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Emplacement</Label>
              <Input id="location" name="location" placeholder="Dépôt principal" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={loading}>
              <Plus className="h-4 w-4" />
              {loading ? "Création…" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
