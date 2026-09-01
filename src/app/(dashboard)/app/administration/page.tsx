import type { Metadata } from "next";
import { getAuthzContext } from "@/server/auth";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import {
  listRoles,
  getRolePermissions,
  listOrgUsers,
  listRoleAssignments,
} from "@/modules/admin";
import { MODULES } from "@/lib/constants";
import { planUserLimit } from "@/lib/plans";
import { RolesManager } from "@/components/feature/admin/roles-manager";
import { InviteCollaboratorButton } from "@/components/feature/admin/invite-collaborator-button";

export const metadata: Metadata = { title: "Administration — Rôles & Permissions" };

export default async function AdministrationPage() {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) redirect("/login");

  const moduleKeys = Object.values(MODULES);

  const [rolesRes, usersRes, assignmentsRes] = await Promise.all([
    listRoles(ctx),
    listOrgUsers(ctx),
    listRoleAssignments(ctx),
  ]);
  const roles = rolesRes.ok ? rolesRes.data : [];
  const users = usersRes.ok ? usersRes.data : [];

  const permsByRole: { roleId: string; perms: Record<string, string[]> }[] = [];
  for (const role of roles) {
    const p = await getRolePermissions(ctx, role.id);
    permsByRole.push({
      roleId: role.id,
      perms: p.ok
        ? Object.fromEntries([...p.data.entries()].map(([k, v]) => [k, [...v]]))
        : {},
    });
  }

  const userRoleMap: Record<string, string[]> = {};
  if (assignmentsRes.ok) {
    for (const a of assignmentsRes.data) {
      (userRoleMap[a.userId] ??= []).push(a.roleId);
    }
  }

  const limit = planUserLimit(ctx.organization.plan ?? "free");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Administration</h1>
            <p className="text-muted-foreground">
              Rôles, permissions et collaborateurs de votre organisation.
            </p>
          </div>
        </div>
        <InviteCollaboratorButton limit={limit} current={users.length} />
      </div>
      <RolesManager
        roles={roles}
        moduleKeys={moduleKeys}
        users={users}
        permsByRole={permsByRole}
        userRoleMap={userRoleMap}
      />
    </div>
  );
}
