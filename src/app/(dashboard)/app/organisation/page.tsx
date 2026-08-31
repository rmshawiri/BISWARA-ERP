import type { Metadata } from "next";
import { getAuthzContext } from "@/server/auth";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrganizationSettingsForm } from "@/components/feature/settings/organization-settings-form";

export const metadata: Metadata = { title: "Mon Organisation" };

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuit",
  standard: "Standard",
  business: "Business",
  vip: "VIP",
};

export default async function OrgPage() {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) redirect("/login");

  const org = ctx.organization;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mon Organisation</h1>
        <p className="text-muted-foreground">
          Identité et paramètres de votre espace BISWARA.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Identité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Identité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">Nom</span>
              <span className="font-medium">{org.name}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">Secteur</span>
              <span className="font-medium">{org.sector ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">Pays</span>
              <span className="font-medium">{org.country}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">Ville</span>
              <span className="font-medium">{org.city ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">Devise</span>
              <span className="font-medium">{org.currency}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">Forfait</span>
              <Badge variant="secondary">{PLAN_LABELS[org.plan] ?? org.plan}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">Statut</span>
              <Badge variant={org.status === "active" ? "success" : "warning"}>
                {org.status === "active" ? "Active" : "Suspendue"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Édition */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Modifier l'organisation</CardTitle>
          </CardHeader>
          <CardContent>
            <OrganizationSettingsForm
              initial={{
                name: org.name,
                slogan: org.slogan ?? "",
                city: org.city ?? "",
                currency: org.currency,
                country: org.country,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
