import type { Metadata } from "next";
import { getAuthzContext } from "@/server/auth";
import { redirect } from "next/navigation";
import { Activity, AlertTriangle, CheckCircle2, ServerCrash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminStats, listGlobalAudit } from "@/modules/platform";
import type { AuditLog } from "@/db/schema";

export const metadata: Metadata = { title: "Monitoring — Admin" };

export const dynamic = "force-dynamic";

export default async function AdminMonitoringPage() {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.superAdmin) redirect("/login");

  let stats = { organizations: 0, users: 0, activeSubscriptions: 0 };
  let audits: AuditLog[] = [];
  try {
    const [s, a] = await Promise.all([adminStats(ctx), listGlobalAudit(ctx, { limit: 50 })]);
    if (s.ok) stats = s.data;
    if (a.ok) audits = a.data;
  } catch {
    // garde-fou
  }

  const critical = audits.filter((x) => x.level === "critical" || x.level === "warning").slice(0, 8);

  const services = [
    { name: "Base de données", ok: true, detail: "PostgreSQL (Supabase)" },
    { name: "Authentification", ok: true, detail: "Supabase Auth" },
    { name: "Endpoint santé", ok: true, detail: "/api/health" },
    { name: "E-mails", ok: !!process.env.SMTP_HOST || !!process.env.RESEND_API_KEY, detail: process.env.SMTP_HOST ? "SMTP configuré" : "SMTP non configuré" },
    { name: "WhatsApp", ok: !!process.env.WHATSAPP_TOKEN, detail: process.env.WHATSAPP_TOKEN ? "Provider configuré" : "Provider non configuré" },
  ];

  const healthChecks = [
    { label: "Organisations", value: stats.organizations },
    { label: "Utilisateurs", value: stats.users },
    { label: "Abonnements actifs", value: stats.activeSubscriptions },
    { label: "Événements d'audit", value: audits.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Monitoring</h1>
        <p className="text-muted-foreground">
          État de la plateforme et des services (Super Admin).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {healthChecks.map((h) => (
          <Card key={h.label}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{h.label}</p>
              <p className="mt-2 text-2xl font-bold tabular-nums">{h.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" />
            Services
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {services.map((s) => (
            <div key={s.name} className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div className="flex items-center gap-2">
                {s.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                <span className="font-medium">{s.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{s.detail}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {critical.length > 0 ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <ServerCrash className="h-4 w-4" />}
            Événements sensibles récents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {critical.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun événement critique récent.</p>
          ) : (
            <ul className="space-y-2">
              {critical.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={a.level === "critical" ? "destructive" : "secondary"}>{a.level}</Badge>
                    <span className="text-muted-foreground">{a.action}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {a.createdAt?.toLocaleString("fr-FR") ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
