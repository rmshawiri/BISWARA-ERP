import type { Metadata } from "next";
import { getAuthzContext } from "@/server/auth";
import { redirect } from "next/navigation";
import { TrendingUp, Wallet, CalendarDays, PiggyBank, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { platformRevenue } from "@/modules/platform";

export const metadata: Metadata = { title: "Revenus — Admin" };

const PLAN_LABELS: Record<string, string> = { free: "Gratuit", standard: "Standard", business: "Business", vip: "VIP" };

export default async function AdminRevenuePage() {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.superAdmin) redirect("/login");

  let rev = { total: 0, month: 0, year: 0, byPlan: {} as Record<string, number>, last6Months: [] as { label: string; amount: number }[] };
  try {
    const res = await platformRevenue(ctx);
    if (res.ok) rev = res.data;
  } catch {
    // garde-fou
  }

  const maxMonth = Math.max(1, ...rev.last6Months.map((m) => m.amount));
  const planKeys = Object.keys(rev.byPlan).sort();
  const maxPlan = Math.max(1, ...planKeys.map((k) => rev.byPlan[k] ?? 0));

  const kpis = [
    { icon: Wallet, label: "Revenu total", value: rev.total },
    { icon: CalendarDays, label: "Ce mois-ci", value: rev.month },
    { icon: PiggyBank, label: "Cette année", value: rev.year },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Revenus</h1>
        <p className="text-muted-foreground">
          Revenus issus des paiements d&apos;abonnements validés (Super Admin).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <k.icon className="h-4 w-4" />
                <p className="text-sm">{k.label}</p>
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">
                {k.value.toLocaleString("fr-FR")} KMF
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Évolution sur 6 mois
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rev.last6Months.length === 0 || maxMonth === 1 && rev.last6Months.every((m) => m.amount === 0) ? (
            <p className="text-sm text-muted-foreground">Aucun paiement validé à ce jour.</p>
          ) : (
            <div className="flex h-40 items-end gap-3">
              {rev.last6Months.map((m) => (
                <div key={m.label} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {m.amount.toLocaleString("fr-FR")}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-biswara-gold-600 to-biswara-gold-400"
                    style={{ height: `${Math.max(4, (m.amount / maxMonth) * 100)}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{m.label}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" />
            Répartition par forfait
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {planKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune donnée.</p>
          ) : (
            planKeys.map((k) => (
              <div key={k} className="flex items-center justify-between">
                <span className="text-sm">{PLAN_LABELS[k] ?? k}</span>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-40 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${((rev.byPlan[k] ?? 0) / maxPlan) * 100}%` }} />
                  </div>
                  <span className="w-24 text-right text-sm tabular-nums">
                    {(rev.byPlan[k] ?? 0).toLocaleString("fr-FR")} KMF
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
