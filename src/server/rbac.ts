import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PermissionAction } from "@/lib/constants";
import { MODULES } from "@/lib/constants";
import type { AuthzContext, UserProfile } from "@/types";
import type { PermissionKey } from "@/types";

const PERM_WILDCARD = "*";

/**
 * Résout les permissions de l'utilisateur connecté.
 *
 * Règles de sécurité :
 * - Super Admin : toutes les permissions.
 * - Administrateur d'organisation : toutes les permissions de l'organisation.
 * - Autres : permissions issues de ses rôles (et de ses permissions individuelles).
 * - Par défaut "deny" : un utilisateur sans rôle n'a AUCUNE permission.
 */
export async function resolvePermissions(
  supabase: SupabaseClient,
  profile: UserProfile
): Promise<Map<string, Set<PermissionAction>>> {
  const perms = new Map<string, Set<PermissionAction>>();

  // Super Admin : tout.
  if (profile.role === "super_admin") {
    for (const moduleKey of Object.values(MODULES)) {
      perms.set(moduleKey, new Set(Object.values({ view: "view", create: "create", update: "update", delete: "delete", validate: "validate", export: "export", import: "import", print: "print", share: "share", configure: "configure" } as Record<PermissionAction, PermissionAction>)));
    }
    return perms;
  }

  if (!profile.organizationId) return perms;

  // Administrateur d'organisation : toutes les permissions de l'organisation.
  if (profile.role === "admin") {
    for (const moduleKey of Object.values(MODULES)) {
      perms.set(moduleKey, new Set((Object.keys({
        view: true,
        create: true,
        update: true,
        delete: true,
        validate: true,
        export: true,
        import: true,
        print: true,
        share: true,
        configure: true,
      }) as PermissionAction[])));
    }
    return perms;
  }

  // Autres rôles : charger depuis la table user_roles / role_permissions.
  const { data: memberships } = await supabase
    .from("user_roles")
    .select("role_id")
    .eq("user_id", profile.id);

  if (!memberships || memberships.length === 0) return perms;

  const roleIds = memberships.map((m) => m.role_id as string);

  const { data: rolePerms } = await supabase
    .from("permission_assignments")
    .select("module, action")
    .in("role_id", roleIds);

  if (!rolePerms) return perms;

  for (const p of rolePerms as { module: string; action: string }[]) {
    if (!perms.has(p.module)) perms.set(p.module, new Set());
    perms.get(p.module)!.add(p.action as PermissionAction);
  }

  // Permissions individuelles (complètent le rôle).
  const { data: individual } = await supabase
    .from("user_permissions")
    .select("module, action")
    .eq("user_id", profile.id);
  if (individual) {
    for (const p of individual as { module: string; action: string }[]) {
      if (!perms.has(p.module)) perms.set(p.module, new Set());
      perms.get(p.module)!.add(p.action as PermissionAction);
    }
  }

  return perms;
}

/** Vérifie si l'utilisateur a la permission module:action. */
export function hasPermission(
  ctx: AuthzContext | null,
  module: string,
  action: PermissionAction
): boolean {
  if (!ctx) return false;
  if (ctx.superAdmin) return true;
  return ctx.permissions.get(module)?.has(action) ?? false;
}

/** Construit une clé de permission "module:action". */
export function permissionKey(module: string, action: PermissionAction): PermissionKey {
  return `${module}:${action}`;
}

/** Vérifie un wildcard global (réservé au Super Admin). */
export function isWildcard(key: PermissionKey): boolean {
  return key === PERM_WILDCARD;
}
