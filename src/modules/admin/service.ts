import "server-only";

import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { roles, userRoles, permissionAssignments, profiles } from "@/db/schema";
import type { AuthzContext } from "@/types";
import { hasPermission } from "@/server/rbac";
import { logAudit } from "@/engines/audit";
import { MODULES, PERMISSION_ACTIONS } from "@/lib/constants";
import { err, ok, Result } from "@/lib/result";

function requireAdmin(ctx: AuthzContext) {
  if (!ctx.organization) throw new Error("Organisation introuvable.");
  if (!hasPermission(ctx, MODULES.ADMIN, "configure")) {
    throw new Error("Accès réservé à l'administration.");
  }
  return ctx.organization.id;
}

export async function listRoles(ctx: AuthzContext) {
  try {
    const orgId = requireAdmin(ctx);
    const rows = await db()
      .select()
      .from(roles)
      .where(eq(roles.organizationId, orgId))
      .orderBy(roles.name);
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

export async function createRole(ctx: AuthzContext, name: string, description?: string) {
  try {
    const orgId = requireAdmin(ctx);
    const [row] = await db()
      .insert(roles)
      .values({ organizationId: orgId, name, description: description ?? null, isSystem: false })
      .returning();
    if (!row) return err("Création du rôle impossible.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: "admin",
      action: "role.create",
      entityType: "role",
      entityId: row.id,
      newValue: { name },
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

export async function deleteRole(ctx: AuthzContext, roleId: string) {
  try {
    const orgId = requireAdmin(ctx);
    await db()
      .delete(roles)
      .where(and(eq(roles.id, roleId), eq(roles.organizationId, orgId)));
    return ok(true);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de suppression");
  }
}

/** Permissions d'un rôle (module × action). */
export async function getRolePermissions(ctx: AuthzContext, roleId: string) {
  try {
    const orgId = requireAdmin(ctx);
    const rows = await db()
      .select({ module: permissionAssignments.module, action: permissionAssignments.action })
      .from(permissionAssignments)
      .where(eq(permissionAssignments.roleId, roleId));
    const set = new Map<string, Set<string>>();
    for (const r of rows) {
      if (!set.has(r.module)) set.set(r.module, new Set());
      set.get(r.module)!.add(r.action);
    }
    return ok(set);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

export async function setRolePermissions(
  ctx: AuthzContext,
  roleId: string,
  perms: { module: string; action: string }[]
) {
  try {
    const orgId = requireAdmin(ctx);
    const [role] = await db()
      .select()
      .from(roles)
      .where(and(eq(roles.id, roleId), eq(roles.organizationId, orgId)))
      .limit(1);
    if (!role) return err("Rôle introuvable.");
    await db().delete(permissionAssignments).where(eq(permissionAssignments.roleId, roleId));
    if (perms.length > 0) {
      await db()
        .insert(permissionAssignments)
        .values(perms.map((p) => ({ roleId, module: p.module, action: p.action })));
    }
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: "admin",
      action: "role.permissions.update",
      entityType: "role",
      entityId: roleId,
    });
    return ok(true);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de mise à jour");
  }
}

/** Liste les utilisateurs de l'organisation (pour attribution de rôle). */
export async function listOrgUsers(ctx: AuthzContext) {
  try {
    const orgId = requireAdmin(ctx);
    const rows = await db()
      .select({ id: profiles.id, fullName: profiles.fullName, username: profiles.username, role: profiles.role })
      .from(profiles)
      .where(eq(profiles.organizationId, orgId));
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** Attribue un rôle à un utilisateur. */
export async function assignRoleToUser(ctx: AuthzContext, userId: string, roleId: string, assign: boolean) {
  try {
    const orgId = requireAdmin(ctx);
    if (assign) {
      await db()
        .insert(userRoles)
        .values({ userId, roleId })
        .onConflictDoNothing();
    } else {
      await db()
        .delete(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
    }
    return ok(true);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur d'attribution");
  }
}

/** Liste les associations utilisateur -> rôle de l'organisation. */
export async function listRoleAssignments(ctx: AuthzContext) {
  try {
    const orgId = requireAdmin(ctx);
    const rows = await db()
      .select({ userId: userRoles.userId, roleId: userRoles.roleId })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(roles.organizationId, orgId));
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

export { PERMISSION_ACTIONS };
