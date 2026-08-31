"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { updateUserSettingsAction } from "@/modules/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UserSettingsForm({
  initial,
}: {
  initial: { fullName: string; phone: string; email: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [fullName, setFullName] = React.useState(initial.fullName);
  const [phone, setPhone] = React.useState(initial.phone);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData();
    fd.set("fullName", fullName);
    fd.set("phone", phone);
    const res = await updateUserSettingsAction(fd);
    setLoading(false);
    if (res.ok) {
      toast.success("Profil mis à jour");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Nom complet</Label>
        <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail (lecture seule)</Label>
        <Input id="email" value={initial.email} disabled readOnly />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone</Label>
        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+269 …" />
      </div>
      <Button type="submit" disabled={loading} className="gap-2">
        <Save className="h-4 w-4" />
        {loading ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
