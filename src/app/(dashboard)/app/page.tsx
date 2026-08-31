import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  CreditCard,
  Package,
  Plus,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { getAuthzContext } from "@/server/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/feature/dashboard/kpi-card";
import { formatCurrency } from "@/lib/utils";
import { db } from "@/db";
import { salesDocuments, products, customers, payments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { LucideIcon } from "lucide-react";

export const metadata: Metadata = { title: "Tableau de bord" };

const recent = [
  { icon: ShoppingCart, text: "Nouvelle commande #CMD-2026-0003", meta: "Il y a 5 min", tone: "primary" },
  { icon: Users, text: "Client créé : SARL Horizon", meta: "Il y a 32 min", tone: "cyan" },
  { icon: CreditCard, text: "Paiement reçu : 120 000 KMF", meta: "Il y a 1 h", tone: "green" },
  { icon: Package, text: "Stock : 8 produits sous le seuil", meta: "Il y a 2 h", tone: "amber" },
];

type Tone = "primary" | "violet" | "cyan" | "green" | "amber" | "rose";
type StatsItem = {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: Tone;
  change?: { value: string; up?: boolean };
};

async function realStats(orgId: string, currency: string): Promise<StatsItem[]> {
  const [rev, orders, prods, clients, pays] = await Promise.all([
    db()
      .select({ total: salesDocuments.total })
      .from(salesDocuments)
      .where(and(eq(salesDocuments.organizationId, orgId), eq(salesDocuments.status, "paid"))),
    db()
      .select({ id: salesDocuments.id })
      .from(salesDocuments)
      .where(and(eq(salesDocuments.organizationId, orgId), eq(salesDocuments.type, "order"))),
    db().select({ id: products.id }).from(products).where(eq(products.organizationId, orgId)),
    db().select({ id: customers.id }).from(customers).where(eq(customers.organizationId, orgId)),
    db()
      .select({ amount: payments.amount })
      .from(payments)
      .where(eq(payments.organizationId, orgId)),
  ]);
  const revenue = rev.reduce((s, r) => s + Number(r.total), 0);
  const collected = pays.reduce((s, p) => s + Number(p.amount), 0);
  return [
    { icon: Wallet, label: "Chiffre d'affaires (facturé)", value: formatCurrency(revenue, currency), tone: "primary", change: { value: "" } },
    { icon: ShoppingCart, label: "Commandes", value: String(orders.length), tone: "violet" },
    { icon: Boxes, label: "Produits", value: String(prods.length), tone: "cyan" },
    { icon: Users, label: "Clients", value: String(clients.length), tone: "green" },
    { icon: CreditCard, label: "Encaissé", value: formatCurrency(collected, currency), tone: "amber" },
    { icon: TrendingUp, label: "CA moyen / commande", value: formatCurrency(orders.length ? Math.round(revenue / orders.length) : 0, currency), tone: "rose" },
  ];
}

export default async function DashboardPage() {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin) redirect("/login");

  const org = ctx.organization!;
  const currency = org.currency;

  let stats: StatsItem[] = [];
  try {
    stats = await realStats(org.id, currency);
  } catch {
    stats = [];
  }

  const bars = [35, 55, 40, 70, 52, 85, 63];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#6d3be8] via-[#7c5cff] to-[#22d3ee] p-6 text-white shadow-card sm:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(50%_60%_at_80%_0%,rgba(255,255,255,0.35),transparent)]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Bienvenue, {ctx.user.fullName.split(" ")[0]}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {org.name}
            </h1>
            <p className="mt-1 text-white/80">
              Voici un aperçu de votre activité aujourd'hui.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-white/20 backdrop-blur" variant="outline">
              Forfait {org.plan}
            </Badge>
            <Link href="/app/catalogue">
              <Button variant="accent" size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> Nouveau produit
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <KpiCard key={s.label} {...s} />
        ))}
      </div>

      {/* Zone graphique + activité */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Aperçu des ventes</CardTitle>
              <p className="text-xs text-muted-foreground">7 derniers jours (fictif)</p>
            </div>
            <Badge variant="secondary">
              <TrendingUp className="mr-1 h-3 w-3" /> +12%
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-end gap-2">
              {bars.map((h, i) => (
                <div key={i} className="group relative flex-1">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-primary/80 to-biswara-violet-500/80 transition-all group-hover:from-primary group-hover:to-biswara-violet-500"
                    style={{ height: `${h}%` }}
                    title={`${h}`}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>Lun</span><span>Mar</span><span>Mer</span><span>Jeu</span><span>Ven</span><span>Sam</span><span>Dim</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activité récente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <r.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.text}</p>
                  <p className="text-xs text-muted-foreground">{r.meta}</p>
                </div>
              </div>
            ))}
            <Link href="/app" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Tout voir <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
