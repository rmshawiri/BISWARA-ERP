import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getAuthzContext } from "@/server/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Boxes,
  CreditCard,
  ShoppingCart,
  Users,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin) redirect("/login");

  const org = ctx.organization!;
  const currency = org.currency;

  const stats = [
    { icon: ShoppingCart, label: "Commandes", value: "0", variant: "blue" },
    { icon: CreditCard, label: "Factures", value: "0", variant: "green" },
    { icon: Boxes, label: "Produits", value: "0", variant: "gold" },
    { icon: Users, label: "Clients", value: "0", variant: "blue" },
    { icon: BarChart3, label: "CA du mois", value: formatCurrency(0, currency), variant: "green" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Bienvenue, {ctx.user.fullName.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground">
          Voici un aperçu de {org.name}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.slice(0, 4).map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-muted p-2.5 text-biswara-blue">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Activité récente</CardTitle>
          </CardHeader>
          <CardContent className="flex h-64 flex-col items-center justify-center text-center text-muted-foreground">
            <BarChart3 className="h-10 w-10 opacity-40" />
            <p className="mt-3 text-sm">
              Vos données s'afficheront ici dès que vous activerez vos modules.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Forfait</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Plan</span>
              <Badge variant="gold">{org.plan}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Devise</span>
              <span className="text-sm font-medium">{currency}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
