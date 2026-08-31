"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, Truck, MapPin } from "lucide-react";
import { createVehicleAction, createDeliveryAction } from "@/modules/logistics/actions";
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

export function NewVehicleButton() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const res = await createVehicleAction(new FormData(e.currentTarget));
    setLoading(false);
    if (res.ok) {
      toast.success("Véhicule ajouté");
      setOpen(false);
      router.refresh();
    } else toast.error(res.error);
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2"><Truck className="h-4 w-4" />Véhicule</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Ajouter un véhicule</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="plate">Immatriculation</Label><Input id="plate" name="plate" required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="model">Modèle</Label><Input id="model" name="model" /></div>
            <div className="space-y-2"><Label htmlFor="capacity">Capacité</Label><Input id="capacity" name="capacity" /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={loading}><Plus className="h-4 w-4" />{loading ? "Ajout…" : "Ajouter"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewDeliveryButton({ vehicles }: { vehicles: { id: string; label: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [vehicleId, setVehicleId] = React.useState("");
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("vehicleId", vehicleId);
    const res = await createDeliveryAction(fd);
    setLoading(false);
    if (res.ok) {
      toast.success("Livraison créée");
      setOpen(false);
      setVehicleId("");
      router.refresh();
    } else toast.error(res.error);
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><MapPin className="h-4 w-4" />Nouvelle livraison</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Créer une livraison</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Véhicule</Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger><SelectValue placeholder="Choisir un véhicule" /></SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (<SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="reference">Référence</Label><Input id="reference" name="reference" /></div>
            <div className="space-y-2"><Label htmlFor="customerName">Client</Label><Input id="customerName" name="customerName" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="origin">Départ</Label><Input id="origin" name="origin" /></div>
            <div className="space-y-2"><Label htmlFor="destination">Destination</Label><Input id="destination" name="destination" /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="scheduledDate">Date prévue</Label><Input id="scheduledDate" name="scheduledDate" type="date" /></div>
          <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Input id="notes" name="notes" /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={loading}><Plus className="h-4 w-4" />{loading ? "Création…" : "Créer"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
