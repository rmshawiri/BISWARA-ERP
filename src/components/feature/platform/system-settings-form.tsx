"use client";

import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Save, Settings } from "lucide-react";
import { updateSystemSettingAction } from "@/modules/platform/system-settings-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FIELDS: { key: string; label: string; placeholder: string }[] = [
  { key: "platform_email", label: "E-mail (info@)", placeholder: "contact@morashawiri.com" },
  { key: "platform_whatsapp", label: "WhatsApp / Téléphone", placeholder: "+2694306306" },
  { key: "platform_site", label: "Site web", placeholder: "www.morashawiri.com" },
  { key: "platform_address", label: "Adresse", placeholder: "Moroni Oasis, route des puffins" },
];

export function SystemSettingsForm({
  initial,
}: {
  initial: Record<string, string>;
}) {
  const router = useRouter();
  const [values, setValues] = React.useState<Record<string, string>>(initial);
  const [pending, startTransition] = React.useTransition();

  function save() {
    startTransition(async () => {
      let ok = true;
      for (const f of FIELDS) {
        const res = await updateSystemSettingAction(f.key, values[f.key] ?? "");
        if (!res.ok) ok = false;
      }
      if (ok) toast.success("Paramètres enregistrés");
      else toast.error("Erreur d'enregistrement");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <Settings className="h-4 w-4" />
        <CardTitle className="text-base">Paramètres de la plateforme</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Coordonnées affichées sur la plateforme (config globale Super Admin).
        </p>
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1">
            <Label>{f.label}</Label>
            <Input
              value={values[f.key] ?? ""}
              placeholder={f.placeholder}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            />
          </div>
        ))}
        <Button onClick={save} disabled={pending}>
          <Save className="mr-1 h-4 w-4" />
          Enregistrer
        </Button>
      </CardContent>
    </Card>
  );
}
