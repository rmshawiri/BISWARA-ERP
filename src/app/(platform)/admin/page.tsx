import type { Metadata } from "next";
import Link from "next/link";
import { getAuthzContext } from "@/server/auth";
import { redirect } from "next/navigation";
import {
  Building2,
  CreditCard,
  Users,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminStats, listOrganizations } from "@/modules/platform";

export const metadata: Metadata = { title: "Administration Plateforme" };

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuit",
  standard: "Standard",
  business: "Business",
  vip: "VIP",
};

export default async function AdminOverviewPage() {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.superAdmin) redirect("/login");

  let stats = { organizations: 0, users: 0, activeSubscriptions: 0 };
  let recent: { id: string; name: string; plan: string; status: string; createdAt: Date }[] = [];
  try {
    const [s, o] = await Promise.all([adminStats(ctx), listOrganizations(ctx)]);
    if (s.ok) stats = s.data;
    if (o.ok) recent = o.data.slice(0, 6);
  } catch {
    // valeurs par défaut
  }

  const cards = [
    { icon: Building2, label: "Organisations", value: String(stats.organizations) },
    { icon: Users, label: "Utilisateurs", value: String(stats.users) },
    { icon: CreditCard, label: "Abonnements actifs", value: String(stats.activeSubscriptions) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord Plateforme</h1>
        <p className="text-muted-foreground">
          Supervision de la plateforme BISWARA (Super Admin).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-biswara-blue/10 p-2.5 text-biswara-blue">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Organisations récentes</CardTitle>
            <Link
              href="/admin/organisations"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Tout voir <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune organisation pour le moment.</p>
            ) : (
              <ul className="space-y-2.5">
                {recent.map((o) => (
                  <li
                    key={o.id}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5 text-sm"
                  >
                    <span className="font-medium">{o.name}</span>
                    <span className="flex items-center gap-2">
                      <Badge variant="secondary">{PLAN_LABELS[o.plan] ?? o.plan}</Badge>
                      <Badge variant={o.status === "active" ? "success" : "warning"}>
                        {o.status === "active" ? "Active" : "Suspendue"}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">État de la plateforme</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span>Mon rôle</span>
              <Badge variant="gold">Super Admin</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span>Compte associé</span>
              <span className="font-medium">{ctx.user.username}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span>Devise par défaut</span>
              <span className="font-medium">{ctx.organization?.currency ?? "KMF"}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 sm:col-span-2">
              <span>Pays principal</span>
              <span className="font-medium">Comores (KM)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
