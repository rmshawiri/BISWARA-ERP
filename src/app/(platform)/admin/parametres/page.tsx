import type { Metadata } from "next";
import { getAuthzContext } from "@/server/auth";
import { redirect } from "next/navigation";
import { listSystemSettings } from "@/modules/platform/system-settings";
import { SystemSettingsForm } from "@/components/feature/platform/system-settings-form";
import { MaintenanceToggle } from "@/components/feature/platform/maintenance-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, ShieldCheck } from "lucide-react";

export const metadata: Metadata = { title: "Paramètres Système — Admin" };

export default async function AdminSettingsPage() {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.superAdmin) redirect("/login");

  const initial: Record<string, string> = {
    platform_email: "contact@morashawiri.com",
    platform_whatsapp: "+2694306306",
    platform_site: "www.morashawiri.com",
    platform_address: "Moroni Oasis, route des puffins",
  };
  try {
    const res = await listSystemSettings(ctx);
    if (res.ok) {
      for (const s of res.data) initial[s.key] = s.value ?? "";
    }
  } catch {
    // défauts
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paramètres Système</h1>
        <p className="text-muted-foreground">
          Configuration globale de la plateforme (Super Admin).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SystemSettingsForm initial={initial} />

        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <Activity className="h-4 w-4" />
            <CardTitle className="text-base">État de la plateforme</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span>Endpoint santé</span>
              <Badge variant="success">/api/health</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span>Services e-mail</span>
              <Badge variant="secondary">SMTP config.</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span>Services WhatsApp</span>
              <Badge variant="secondary">Provider config.</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span>CI / Build</span>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 sm:col-span-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Moteurs transversaux
              </span>
              <Badge variant="success">Opérationnels</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <MaintenanceToggle enabled={initial.maintenance_enabled === "true"} />
    </div>
  );
}
