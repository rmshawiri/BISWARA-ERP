"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { updateOrganizationSettingsAction } from "@/modules/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OrganizationSettingsForm({
  initial,
}: {
  initial: {
    name: string;
    slogan: string;
    city: string;
    currency: string;
    country: string;
  };
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [name, setName] = React.useState(initial.name);
  const [slogan, setSlogan] = React.useState(initial.slogan);
  const [city, setCity] = React.useState(initial.city);
  const [currency, setCurrency] = React.useState(initial.currency);
  const [country, setCountry] = React.useState(initial.country);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("slogan", slogan);
    fd.set("city", city);
    fd.set("currency", currency);
    fd.set("country", country);
    const res = await updateOrganizationSettingsAction(fd);
    setLoading(false);
    if (res.ok) {
      toast.success("Organisation mise à jour");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom de l'organisation</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slogan">Slogan</Label>
        <Input id="slogan" value={slogan} onChange={(e) => setSlogan(e.target.value)} placeholder="Le Choix Optimal…" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">Ville</Label>
          <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Moroni" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Devise</Label>
          <Input id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="KMF" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="country">Pays (code ISO)</Label>
        <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="KM" maxLength={2} />
      </div>
      <Button type="submit" disabled={loading} className="gap-2">
        <Save className="h-4 w-4" />
        {loading ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
