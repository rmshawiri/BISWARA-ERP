import type { Metadata } from "next";
import { getAuthzContext } from "@/server/auth";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listUsers, type AdminUser } from "@/modules/platform";
import { ResetPasswordButton } from "@/components/feature/platform/admin-reset-password";
import { UserRoleSelect } from "@/components/feature/platform/user-role-select";
import { AdminTableFilters } from "@/components/feature/platform/admin-table-filters";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Utilisateurs — Admin" };

const PAGE_SIZE = 10;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; role?: string; page?: string }>;
}) {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.superAdmin) redirect("/login");

  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const status = sp.status ?? "";
  const role = sp.role ?? "";
  const page = Math.max(1, Number(sp.page) || 1);

  let users: AdminUser[] = [];
  try {
    const res = await listUsers(ctx);
    if (res.ok) users = res.data;
  } catch {
    // garde-fou
  }

  let filtered = users;
  if (q) {
    filtered = filtered.filter((u) =>
      [u.fullName, u.username, u.email, u.orgName]
        .some((x) => (x ?? "").toLowerCase().includes(q))
    );
  }
  if (status) filtered = filtered.filter((u) => u.status === status);
  if (role) filtered = filtered.filter((u) => u.role === role);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Utilisateurs Plateforme</h1>
        <p className="text-muted-foreground">
          Comptes, rôles et accès (Super Admin).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Utilisateurs ({total})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AdminTableFilters
            basePath="/admin/utilisateurs"
            q={sp.q}
            statusValue={status}
            statusLabel="Statut"
            statusOptions={[
              { value: "active", label: "Actif" },
              { value: "suspended", label: "Suspendu" },
              { value: "pending", label: "En attente" },
            ]}
            secondaryValue={role}
            secondaryLabel="Rôle"
            secondaryKey="role"
            secondaryOptions={[
              { value: "user", label: "Utilisateur" },
              { value: "admin", label: "Admin" },
              { value: "super_admin", label: "Super Admin" },
            ]}
            placeholder="Nom, identifiant, e-mail…"
          />

          {rows.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Aucun utilisateur"
              description={
                q || status || role
                  ? "Aucun résultat pour ces filtres."
                  : "Aucun utilisateur enregistré sur la plateforme."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="pb-2 pr-4">Nom</th>
                    <th className="pb-2 pr-4">Identifiant</th>
                    <th className="pb-2 pr-4">E-mail</th>
                    <th className="pb-2 pr-4">Rôle</th>
                    <th className="pb-2 pr-4">Organisation</th>
                    <th className="pb-2 pr-4">Statut</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{u.fullName}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{u.username}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{u.email ?? "—"}</td>
                      <td className="py-3 pr-4">
                        <UserRoleSelect userId={u.id} role={u.role} />
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{u.orgName ?? "—"}</td>
                      <td className="py-3">
                        <Badge variant={u.status === "active" ? "success" : "warning"}>
                          {u.status === "active" ? "Actif" : u.status === "suspended" ? "Suspendu" : u.status}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <ResetPasswordButton userId={u.id} />
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
    </div>
  );
}
