import type { Metadata } from "next";
import { getAuthzContext } from "@/server/auth";
import { redirect } from "next/navigation";
import {
  Building2,
  CreditCard,
  Users,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Administration Plateforme" };

export default async function AdminOverviewPage() {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.superAdmin) redirect("/login");

  const stats = [
    { icon: Building2, label: "Organisations", value: "—" },
    { icon: Users, label: "Utilisateurs", value: "—" },
    { icon: CreditCard, label: "Abonnements actifs", value: "—" },
    { icon: Wallet, label: "Revenus du mois", value: "—" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord Plateforme</h1>
        <p className="text-muted-foreground">
          Supervision de la plateforme BISWARA (Super Admin).
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-biswara-blue/10 p-2.5 text-biswara-blue">
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
        </CardContent>
      </Card>
    </div>
  );
}
