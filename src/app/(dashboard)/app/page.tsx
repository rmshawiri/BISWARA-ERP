import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  Boxes,
  CreditCard,
  Plus,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  AlertTriangle,
  PieChart,
} from "lucide-react";
import { getAuthzContext } from "@/server/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/feature/dashboard/kpi-card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import { db } from "@/db";
import { salesDocuments, products, customers, payments, opportunities, stockMovements } from "@/db/schema";
import { eq, and, ne, sql } from "drizzle-orm";
import type { LucideIcon } from "lucide-react";

export const metadata: Metadata = { title: "Tableau de bord" };

type Tone = "primary" | "violet" | "cyan" | "green" | "amber" | "rose";
type StatsItem = {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: Tone;
  change?: { value: string; up?: boolean };
};

async function realStats(orgId: string, currency: string): Promise<StatsItem[]> {
  const [rev, orders, prods, clients, pays, invoices, opps] = await Promise.all([
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
    // Créances : factures non payées.
    db()
      .select({ total: salesDocuments.total })
      .from(salesDocuments)
      .where(
        and(
          eq(salesDocuments.organizationId, orgId),
          eq(salesDocuments.type, "invoice"),
          ne(salesDocuments.status, "paid")
        )
      ),
    // Opportunités ouvertes (pipeline CRM).
    db()
      .select({ value: opportunities.value })
      .from(opportunities)
      .where(and(eq(opportunities.organizationId, orgId), eq(opportunities.status, "open"))),
  ]);
  const revenue = rev.reduce((s, r) => s + Number(r.total), 0);
  const collected = pays.reduce((s, p) => s + Number(p.amount), 0);
  const receivables = invoices.reduce((s, r) => s + Number(r.total), 0);
  const openOppsValue = opps.reduce((s, o) => s + Number(o.value ?? 0), 0);
  return [
    { icon: Wallet, label: "Chiffre d'affaires (facturé)", value: formatCurrency(revenue, currency), tone: "primary", change: { value: "" } },
    { icon: ShoppingCart, label: "Commandes", value: String(orders.length), tone: "violet" },
    { icon: CreditCard, label: "Créances (factures impayées)", value: formatCurrency(receivables, currency), tone: "rose" },
    { icon: TrendingUp, label: "Opportunités ouvertes", value: `${openOppsValue ? formatCurrency(openOppsValue, currency) : 0}`, tone: "amber" },
    { icon: Boxes, label: "Produits", value: String(prods.length), tone: "cyan" },
    { icon: Users, label: "Clients", value: String(clients.length), tone: "green" },
    { icon: CreditCard, label: "Encaissé", value: formatCurrency(collected, currency), tone: "primary" },
    { icon: TrendingUp, label: "CA moyen / commande", value: formatCurrency(orders.length ? Math.round(revenue / orders.length) : 0, currency), tone: "rose" },
  ];
}

export default async function DashboardPage() {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) redirect("/login");

  const org = ctx.organization!;
  const currency = org.currency;

  let stats: StatsItem[] = [];
  let recentActivity: { icon: LucideIcon; text: string; meta: string; tone: Tone }[] = [];
  let chart: number[] = [];
  let dayLabels: string[] = [];
  let dbReady = true;
  let stockValue = 0;
  const lowStock: { name: string; qty: number; ref?: string | null }[] = [];
  let pipeline: { stage: string; value: number }[] = [];

  try {
    stats = await realStats(org.id, currency);

    // Stock : valeur + alertes rupture.
    const [prods, levels] = await Promise.all([
      db()
        .select({ id: products.id, name: products.name, reference: products.reference, salePrice: products.salePrice, isService: products.isService })
        .from(products)
        .where(and(eq(products.organizationId, org.id), eq(products.active, true))),
      db()
        .select({
          productId: stockMovements.productId,
          qty: sql<number>`sum(case when ${stockMovements.type} in ('in','adjust','inventory') then ${stockMovements.quantity} else -${stockMovements.quantity} end)`,
        })
        .from(stockMovements)
        .where(eq(stockMovements.organizationId, org.id))
        .groupBy(stockMovements.productId),
    ]);
    const qtyMap = new Map(levels.map((l) => [l.productId, Number(l.qty ?? 0)]));
    for (const p of prods) {
      const qty = qtyMap.get(p.id) ?? 0;
      if (!p.isService) stockValue += Number(p.salePrice ?? 0) * qty;
      if (!p.isService && qty <= 10 && qty >= 0) lowStock.push({ name: p.name, qty, ref: p.reference });
    }
    lowStock.sort((a, b) => a.qty - b.qty);

    // Pipeline CRM : répartition par étape (opportunités ouvertes).
    const oppRows = await db()
      .select({ stage: opportunities.stage, value: opportunities.value })
      .from(opportunities)
      .where(and(eq(opportunities.organizationId, org.id), eq(opportunities.status, "open")));
    const pipeMap = new Map<string, number>();
    for (const o of oppRows) pipeMap.set(o.stage, (pipeMap.get(o.stage) ?? 0) + Number(o.value ?? 0));
    pipeline = [...pipeMap.entries()].map(([stage, value]) => ({ stage, value: Math.round(value) }));

    // Activité récente réelle : derniers documents commerciaux.
    const recentDocs = await db()
      .select({ type: salesDocuments.type, number: salesDocuments.number, date: salesDocuments.date, total: salesDocuments.total })
      .from(salesDocuments)
      .where(eq(salesDocuments.organizationId, org.id))
      .orderBy(salesDocuments.createdAt)
      .limit(5);
    const typeLabel = { quote: "Devis", order: "Commande", delivery: "Livraison", invoice: "Facture", credit_note: "Avoir" } as Record<string, string>;
    recentActivity = recentDocs.map((d) => ({
      icon: ShoppingCart,
      text: `${typeLabel[d.type] ?? d.type} ${d.number}`,
      meta: `${d.date ?? "—"} · ${formatCurrency(Number(d.total), currency)}`,
      tone: "primary",
    }));

    // Graphique réel : total des documents par jour sur les 7 derniers jours.
    const docs = await db()
      .select({ date: salesDocuments.date, total: salesDocuments.total })
      .from(salesDocuments)
      .where(eq(salesDocuments.organizationId, org.id));
    const buckets = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { key: d.toISOString().slice(0, 10), label: d.toLocaleDateString("fr-FR", { weekday: "short" }), total: 0, max: 0 };
    });
    const byDay = new Map(buckets.map((b) => [b.key, b]));
    for (const d of docs) {
      if (d.date && byDay.has(d.date)) {
        byDay.get(d.date)!.total += Number(d.total);
      }
    }
    const max = Math.max(1, ...buckets.map((b) => b.total));
    chart = buckets.map((b) => Math.round((b.total / max) * 100));
    dayLabels = buckets.map((b) => b.label);
  } catch {
    // garde-fou : base indisponible → on ne casse pas la page, on l'indique.
    dbReady = false;
  }

  return (
    <div className="space-y-6">
      {/* En-tête du tableau de bord (sobre, intégré au contenu) */}
      <div className="flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-biswara-gold-500" />
            Bienvenue, {ctx.user.fullName.split(" ")[0]}
          </p>
          <h1 className="mt-1.5 truncate text-2xl font-bold tracking-tight">{org.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Voici un aperçu de votre activité aujourd'hui.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Badge variant="secondary">Forfait {org.plan}</Badge>
          <Link href="/app/catalogue">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Nouveau produit
            </Button>
          </Link>
        </div>
      </div>

      {!dbReady && (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            ⚠️ Les données du tableau de bord sont momentanément indisponibles.
            Le tableau de bord réapparaîtra automatiquement dès que la connexion
            à la base de données sera rétablie.
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <KpiCard key={s.label} {...s} />
        ))}
        <KpiCard icon={Boxes} label="Valeur du stock" value={formatCurrency(stockValue, currency)} tone="cyan" />
      </div>

      {/* Stock & Pipeline CRM */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <CardTitle className="text-base">Alertes stock (rupture / sous-seuil)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStock.length === 0 && <p className="text-sm text-muted-foreground">Aucune alerte stock. Bon niveau !</p>}
            {lowStock.map((s, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.name}</p>
                  {s.ref && <p className="text-xs text-muted-foreground">{s.ref}</p>}
                </div>
                <Badge variant="warning">{s.qty} unité(s)</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <PieChart className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Pipeline CRM (par étape)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pipeline.length === 0 && <p className="text-sm text-muted-foreground">Aucune opportunité ouverte.</p>}
            {pipeline.map((s) => (
              <div key={s.stage} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                <span className="capitalize">{s.stage}</span>
                <span className="font-medium tabular-nums">{formatCurrency(s.value, currency)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Zone graphique + activité */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Aperçu des ventes</CardTitle>
              <p className="text-xs text-muted-foreground">7 derniers jours (données réelles)</p>
            </div>
            {recentActivity.length > 0 && (
              <Badge variant="secondary">
                {recentActivity.length} document(s) récent(s)
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {chart.every((h) => h === 0) ? (
              <EmptyState
                icon={BarChart3}
                title="Aucune vente sur les 7 derniers jours"
                description="Créez un devis, une commande ou une facture pour voir apparaître vos ventes ici."
              />
            ) : (
              <div className="flex h-40 items-end gap-2">
                {chart.map((h, i) => (
                  <div key={i} className="group relative flex-1">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-primary/80 to-biswara-violet-500/80 transition-all group-hover:from-primary group-hover:to-biswara-violet-500"
                      style={{ height: `${Math.max(4, h)}%` }}
                      title={dayLabels[i] ?? ""}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              {dayLabels.length ? dayLabels.map((l, i) => <span key={i}>{l}</span>) : <span>—</span>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activité récente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length === 0 ? (
              <EmptyState icon={ShoppingCart} title="Aucune activité récente" />
            ) : (
              recentActivity.map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <r.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.text}</p>
                    <p className="text-xs text-muted-foreground">{r.meta}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
