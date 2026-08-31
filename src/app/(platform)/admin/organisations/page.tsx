import type { Metadata } from "next";
import { getAuthzContext } from "@/server/auth";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listOrganizations } from "@/modules/platform";
import type { Organization } from "@/db/schema";
import { OrgActions } from "@/components/feature/platform/admin-org-actions";

export const metadata: Metadata = { title: "Organisations — Admin" };

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuit",
  standard: "Standard",
  business: "Business",
  vip: "VIP",
};

export default async function AdminOrganizationsPage() {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.superAdmin) redirect("/login");

  let orgs: Organization[] = [];
  try {
    const res = await listOrganizations(ctx);
    if (res.ok) orgs = res.data;
  } catch {
    // garde-fou
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Organisations</h1>
        <p className="text-muted-foreground">
          Toutes les organisations de la plateforme (Super Admin).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Organisations ({orgs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orgs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
              <Building2 className="h-10 w-10 opacity-40" />
              <p className="text-sm">Aucune organisation inscrite.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="pb-2 pr-4">Nom</th>
                    <th className="pb-2 pr-4">Secteur</th>
                    <th className="pb-2 pr-4">Pays</th>
                    <th className="pb-2 pr-4">Forfait</th>
                    <th className="pb-2 pr-4">Statut</th>
                    <th className="pb-2 pr-4">Créée le</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orgs.map((o) => (
                    <tr key={o.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{o.name}</td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {o.sector ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{o.country}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="secondary">{PLAN_LABELS[o.plan] ?? o.plan}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={o.status === "active" ? "success" : "warning"}>
                          {o.status === "active" ? "Active" : "Suspendue"}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {o.createdAt?.toLocaleDateString("fr-FR") ?? "—"}
                      </td>
                      <td className="py-3">
                        <OrgActions orgId={o.id} status={o.status} plan={o.plan} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
