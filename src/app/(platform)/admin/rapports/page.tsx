import type { Metadata } from "next";
import { getAuthzContext } from "@/server/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { organizations, profiles, subscriptions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { PLANS, PLAN_LABELS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Building2, Users, CreditCard } from "lucide-react";

export const metadata: Metadata = { title: "Rapports — Admin" };
export const dynamic = "force-dynamic";

const PLAN_PRICE: Record<string, number> = {
  free: 0,
  standard: 5000,
  business: 10000,
  vip: 20000,
};

export default async function AdminReportsPage() {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.superAdmin) redirect("/login");

  let orgs = 0;
  let users = 0;
  let actives = 0;
  const plans: Record<string, number> = {};
  let mrr = 0;
  try {
    const [o, u, s] = await Promise.all([
      db().select({ c: sql<number>`count(*)::int` }).from(organizations),
      db().select({ c: sql<number>`count(*)::int` }).from(profiles),
      db().select({ plan: subscriptions.plan, status: subscriptions.status }).from(subscriptions),
    ]);
    orgs = Number(o[0]?.c ?? 0);
    users = Number(u[0]?.c ?? 0);
    actives = s.filter((x) => x.status === "active").length;
    for (const x of s) plans[x.plan] = (plans[x.plan] ?? 0) + 1;
    mrr = s.reduce((sum, x) => sum + (PLAN_PRICE[x.plan] ?? 0), 0);
  } catch {
    // garde-fou
  }

  const kpis = [
    { icon: Building2, label: "Organisations", value: String(orgs) },
    { icon: Users, label: "Utilisateurs", value: String(users) },
    { icon: CreditCard, label: "Abonnements actifs", value: String(actives) },
    { icon: BarChart3, label: "Revenus estimés (MRR)", value: `${mrr.toLocaleString("fr-FR")} KMF` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rapports de la plateforme</h1>
        <p className="text-muted-foreground">Supervision et indicateurs globaux (Super Admin).</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <k.icon className="h-4 w-4" />
                <p className="text-sm">{k.label}</p>
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Répartition des forfaits</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {Object.keys(plans).length === 0 && <p className="text-sm text-muted-foreground">Aucun abonnement.</p>}
          {Object.entries(plans).map(([plan, count]) => (
            <div key={plan} className="flex items-center justify-between rounded-lg border p-2 text-sm">
              <span className="font-medium">{PLAN_LABELS[plan as keyof typeof PLAN_LABELS] ?? plan}</span>
              <span className="flex items-center gap-2">
                <Badge variant="secondary">{count}</Badge>
                <span className="tabular-nums text-muted-foreground">{PLAN_PRICE[plan] ?? 0} KMF/mois</span>
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
