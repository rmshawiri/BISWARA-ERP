import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getAuthzContext } from "@/server/auth";
import { listSuperAdmins } from "@/modules/platform";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateSuperAdminButton } from "@/components/feature/platform/create-super-admin-button";
import { ResetPasswordButton } from "@/components/feature/platform/admin-reset-password";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Super Admins — Admin" };

export default async function AdminSuperAdminsPage() {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.superAdmin) redirect("/login");

  let admins: { id: string; fullName: string; username: string; email: string | null; status: string; createdAt: Date }[] = [];
  try {
    const res = await listSuperAdmins(ctx);
    if (res.ok) admins = res.data;
  } catch {
    // garde-fou
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Super Admins</h1>
          <p className="text-muted-foreground">
            Comptes d&apos;administration de la plateforme.
          </p>
        </div>
        <CreateSuperAdminButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4" />
            Administrateurs plateforme ({admins.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="Aucun Super Admin" description="Aucun compte d'administration. Impossible de gérer la plateforme." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="pb-2 pr-4">Nom</th>
                    <th className="pb-2 pr-4">Identifiant</th>
                    <th className="pb-2 pr-4">E-mail</th>
                    <th className="pb-2 pr-4">Statut</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a) => (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{a.fullName}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{a.username}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{a.email ?? "—"}</td>
                      <td className="py-3">
                        <Badge variant={a.status === "active" ? "success" : "warning"}>
                          {a.status === "active" ? "Actif" : "Suspendu"}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <ResetPasswordButton userId={a.id} />
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
