import type { Metadata } from "next";
import { getAuthzContext } from "@/server/auth";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listUsers, type AdminUser } from "@/modules/platform";

export const metadata: Metadata = { title: "Utilisateurs — Admin" };

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Manager",
  user: "Utilisateur",
};

export default async function AdminUsersPage() {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.superAdmin) redirect("/login");

  let users: AdminUser[] = [];
  try {
    const res = await listUsers(ctx);
    if (res.ok) users = res.data;
  } catch {
    // garde-fou
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Utilisateurs Plateforme</h1>
        <p className="text-muted-foreground">
          Comptes et rôles (Super Admin).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Utilisateurs ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun utilisateur.</p>
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
                    <th className="pb-2">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{u.fullName}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{u.username}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{u.email ?? "—"}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={u.role === "super_admin" ? "gold" : "secondary"}>
                          {ROLE_LABELS[u.role] ?? u.role}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{u.orgName ?? "—"}</td>
                      <td className="py-3">
                        <Badge variant={u.status === "active" ? "success" : "warning"}>
                          {u.status === "active" ? "Actif" : "Suspendu"}
                        </Badge>
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
