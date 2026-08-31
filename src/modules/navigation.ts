import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizationModules } from "@/db/schema";
import type { AuthzContext } from "@/types";
import { hasPermission } from "@/server/rbac";
import { planAllowsModule } from "@/lib/plans";
import { MODULES, type ModuleKey } from "@/lib/constants";

/**
 * Calcule la liste des modules réellement accessibles à l'utilisateur :
 *   forfait autorisé ($plan)  ∧  module activé pour l'organisation  ∧  permission "view".
 * Si l'organisation n'a jamais défini ses modules activés (table vide),
 * on se rabat sur les modules autorisés par le forfait.
 */
export async function getAllowedModules(ctx: AuthzContext): Promise<ModuleKey[]> {
  const plan = ctx.organization?.plan ?? "free";
  const planAllowed = Object.values(MODULES).filter((m) => planAllowsModule(plan, m));

  // Modules activés par l'organisation (si la table est alimentée).
  let activeOverrides: Set<string> | null = null;
  if (ctx.organization?.id) {
    try {
      const rows = await db()
        .select({ moduleId: organizationModules.moduleId, active: organizationModules.active })
        .from(organizationModules)
        .where(eq(organizationModules.organizationId, ctx.organization.id));
      if (rows.length > 0) {
        activeOverrides = new Set(
          rows.filter((r) => r.active).map((r) => r.moduleId as string)
        );
      }
    } catch {
      // Table non disponible : on ignore (repli sur le forfait).
    }
  }

  return planAllowed.filter((moduleKey) => {
    if (activeOverrides && !activeOverrides.has(moduleKey)) return false;
    return hasPermission(ctx, moduleKey, "view");
  });
}
