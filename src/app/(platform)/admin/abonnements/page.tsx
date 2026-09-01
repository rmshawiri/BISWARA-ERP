import type { Metadata } from "next";
import { getAuthzContext } from "@/server/auth";
import { redirect } from "next/navigation";
import { CreditCard, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listSubscriptions, listSubscriptionActivity, type AdminSubscription } from "@/modules/platform";
import type { AuditLog } from "@/db/schema";
import { OrgActions } from "@/components/feature/platform/admin-org-actions";
import { AdminTableFilters } from "@/components/feature/platform/admin-table-filters";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Abonnements — Admin" };

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuit",
  standard: "Standard",
  business: "Business",
  vip: "VIP",
};

const PAGE_SIZE = 10;

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; plan?: string; page?: string }>;
}) {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.superAdmin) redirect("/login");

  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const status = sp.status ?? "";
  const plan = sp.plan ?? "";
  const page = Math.max(1, Number(sp.page) || 1);

  let subs: AdminSubscription[] = [];
  let activity: AuditLog[] = [];
  try {
    const [s, a] = await Promise.all([listSubscriptions(ctx), listSubscriptionActivity(ctx)]);
    if (s.ok) subs = s.data;
    if (a.ok) activity = a.data;
  } catch {
    // garde-fou
  }

  let filtered = subs;
  if (q) filtered = filtered.filter((s) => (s.orgName ?? "").toLowerCase().includes(q));
  if (plan) filtered = filtered.filter((s) => s.plan === plan);
  if (status) {
    filtered = filtered.filter((s) => {
      if (status === "expired") return !!s.endedAt && new Date(s.endedAt) < new Date();
      return s.status === status;
    });
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const actionLabel: Record<string, string> = {
    "subscription.change_plan": "Forfait modifié",
    "subscription.activate": "Abonnement activé",
    "subscription.set_trial": "Essai prolongé",
    "subscription.set_discount": "Remise appliquée",
    "organization.suspend": "Organisation suspendue",
    "organization.reactivate": "Organisation réactivée",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Abonnements</h1>
        <p className="text-muted-foreground">
          Suivi des abonnements, forfaits, essais et remises (Super Admin).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            Abonnements ({total})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AdminTableFilters
            basePath="/admin/abonnements"
            q={sp.q}
            statusValue={status}
            statusLabel="Statut"
            statusOptions={[
              { value: "active", label: "Actif" },
              { value: "expired", label: "Expiré" },
              { value: "canceled", label: "Annulé" },
              { value: "pending", label: "En attente" },
            ]}
            secondaryValue={plan}
            secondaryLabel="Forfait"
            secondaryKey="plan"
            secondaryOptions={[
              { value: "free", label: "Gratuit" },
              { value: "standard", label: "Standard" },
              { value: "business", label: "Business" },
              { value: "vip", label: "VIP" },
            ]}
            placeholder="Organisation…"
          />

          {rows.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="Aucun abonnement"
              description={
                q || status || plan
                  ? "Aucun résultat pour ces filtres."
                  : "Aucun abonnement enregistré."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="pb-2 pr-4">Organisation</th>
                    <th className="pb-2 pr-4">Forfait</th>
                    <th className="pb-2 pr-4">Statut</th>
                    <th className="pb-2 pr-4">Remise</th>
                    <th className="pb-2 pr-4">Essai</th>
                    <th className="pb-2 pr-4">Début</th>
                    <th className="pb-2 pr-4">Fin</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
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
                        {s.discountPercent > 0 ? `${s.discountPercent}%` : "—"}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {s.trialEndsAt ? s.trialEndsAt.toLocaleDateString("fr-FR") : "—"}
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
                          discountPercent={s.discountPercent}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {total > PAGE_SIZE && (
            <Pagination page={page} totalPages={totalPages} total={total} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Historique des abonnements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun événement d&apos;abonnement.</p>
          ) : (
            <ul className="space-y-2">
              {activity.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {actionLabel[a.action] ?? a.action}
                    </Badge>
                    <span className="text-muted-foreground">{a.userName ?? "Système"}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {a.createdAt?.toLocaleString("fr-FR") ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
