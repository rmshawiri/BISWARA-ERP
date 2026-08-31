import type { Metadata } from "next";
import { getAuthzContext } from "@/server/auth";
import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listSubscriptions, type AdminSubscription } from "@/modules/platform";
import { OrgActions } from "@/components/feature/platform/admin-org-actions";

export const metadata: Metadata = { title: "Abonnements — Admin" };

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuit",
  standard: "Standard",
  business: "Business",
  vip: "VIP",
};

export default async function AdminSubscriptionsPage() {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.superAdmin) redirect("/login");

  let subs: AdminSubscription[] = [];
  try {
    const res = await listSubscriptions(ctx);
    if (res.ok) subs = res.data;
  } catch {
    // garde-fou
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Abonnements</h1>
        <p className="text-muted-foreground">
          Suivi des abonnements et des forfaits (Super Admin).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            Abonnements ({subs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun abonnement enregistré.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="pb-2 pr-4">Organisation</th>
                    <th className="pb-2 pr-4">Forfait</th>
                    <th className="pb-2 pr-4">Statut</th>
                    <th className="pb-2 pr-4">Début</th>
                    <th className="pb-2 pr-4">Fin</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subs.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{s.orgName ?? "—"}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="secondary">{PLAN_LABELS[s.plan] ?? s.plan}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={s.status === "active" ? "success" : "warning"}>
                          {s.status === "active" ? "Actif" : s.status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {s.startedAt?.toLocaleDateString("fr-FR") ?? "—"}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {s.endedAt?.toLocaleDateString("fr-FR") ?? "Illimitée"}
                      </td>
                      <td className="py-3">
                        <OrgActions
                          orgId={s.organizationId ?? ""}
                          status={s.status}
                          plan={s.plan}
                        />
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
