import type { Metadata } from "next";
import { getAuthzContext } from "@/server/auth";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { profiles, organizationModules, auditLogs } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listOrganizations } from "@/modules/platform";
import type { Organization } from "@/db/schema";
import { OrgActions } from "@/components/feature/platform/admin-org-actions";
import { CreateOrganizationButton } from "@/components/feature/platform/create-organization-button";
import { AdminTableFilters } from "@/components/feature/platform/admin-table-filters";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Organisations — Admin" };

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuit",
  standard: "Standard",
  business: "Business",
  vip: "VIP",
};

const PAGE_SIZE = 10;

export default async function AdminOrganizationsPage({
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

  let orgs: Organization[] = [];
  try {
    const res = await listOrganizations(ctx);
    if (res.ok) orgs = res.data;
  } catch {
    // garde-fou
  }

  // Comptages agrégés (1 requête par métrique, pas de N+1) pour enrichir la fiche.
  let countByOrg: Record<string, { users: number; modules: number; lastActivity: string | null }> = {};
  try {
    const [usersRes, modsRes, auditRes] = await Promise.all([
      db()
        .select({ orgId: profiles.organizationId, c: sql<number>`count(*)::int` })
        .from(profiles)
        .groupBy(profiles.organizationId),
      db()
        .select({ orgId: organizationModules.organizationId, c: sql<number>`count(*)::int` })
        .from(organizationModules)
        .where(sql`${organizationModules.active} = true`)
        .groupBy(organizationModules.organizationId),
      db()
        .select({ orgId: auditLogs.organizationId, d: sql<string | null>`max(${auditLogs.createdAt})` })
        .from(auditLogs)
        .groupBy(auditLogs.organizationId),
    ]);
    const counts: Record<string, { users: number; modules: number; lastActivity: string | null }> = {};
    for (const r of usersRes) if (r.orgId) counts[r.orgId] = { users: Number(r.c ?? 0), modules: 0, lastActivity: null };
    for (const r of modsRes) if (r.orgId) counts[r.orgId] = { ...(counts[r.orgId] ?? { users: 0, modules: 0, lastActivity: null }), modules: Number(r.c ?? 0) };
    for (const r of auditRes) if (r.orgId) counts[r.orgId] = { ...(counts[r.orgId] ?? { users: 0, modules: 0, lastActivity: null }), lastActivity: r.d };
    countByOrg = counts;
  } catch {
    // garde-fou
  }

  let filtered = orgs;
  if (q) {
    filtered = filtered.filter((o) =>
      [o.name, o.sector, o.city].some((x) => (x ?? "").toLowerCase().includes(q))
    );
  }
  if (plan) filtered = filtered.filter((o) => o.plan === plan);
  if (status) filtered = filtered.filter((o) => o.status === status);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Organisations</h1>
          <p className="text-muted-foreground">
            Toutes les organisations de la plateforme (Super Admin).
          </p>
        </div>
        <CreateOrganizationButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Organisations ({total})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AdminTableFilters
            basePath="/admin/organisations"
            q={sp.q}
            statusValue={status}
            statusLabel="Statut"
            statusOptions={[
              { value: "active", label: "Active" },
              { value: "suspended", label: "Suspendue" },
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
            placeholder="Nom, secteur, ville…"
          />

          {rows.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Aucune organisation"
              description={
                q || status || plan
                  ? "Aucun résultat pour ces filtres."
                  : "Aucune organisation inscrite."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="pb-2 pr-4">Nom</th>
                    <th className="pb-2 pr-4">Secteur</th>
                    <th className="pb-2 pr-4">Pays / Ville</th>
                    <th className="pb-2 pr-4">Utilisateurs</th>
                    <th className="pb-2 pr-4">Modules</th>
                    <th className="pb-2 pr-4">Dernière activité</th>
                    <th className="pb-2 pr-4">Forfait</th>
                    <th className="pb-2 pr-4">Statut</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((o) => {
                    const c = countByOrg[o.id] ?? { users: 0, modules: 0, lastActivity: null };
                    return (
                      <tr key={o.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium">{o.name}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{o.sector ?? "—"}</td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {o.country}
                          {o.city ? ` · ${o.city}` : ""}
                        </td>
                        <td className="py-3 pr-4">{c.users}</td>
                        <td className="py-3 pr-4">{c.modules}</td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {c.lastActivity ? new Date(c.lastActivity).toLocaleDateString("fr-FR") : "—"}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant="secondary">{PLAN_LABELS[o.plan] ?? o.plan}</Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={o.status === "active" ? "success" : "warning"}>
                            {o.status === "active" ? "Active" : "Suspendue"}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <OrgActions orgId={o.id} status={o.status} plan={o.plan} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {total > PAGE_SIZE && (
            <Pagination page={page} totalPages={totalPages} total={total} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
