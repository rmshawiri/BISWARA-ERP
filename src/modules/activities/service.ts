import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  activities,
  modules,
  organizationActivities,
  organizationModules,
} from "@/db/schema";
import type { AuthzContext } from "@/types";
import { hasPermission } from "@/server/rbac";
import { logAudit } from "@/engines/audit";
import { MODULES } from "@/lib/constants";
import { err, ok, Result } from "@/lib/result";

function requireOrg(ctx: AuthzContext) {
  if (!ctx.organization) throw new Error("Organisation introuvable.");
  return ctx.organization.id;
}

function requireSetting(ctx: AuthzContext) {
  if (!hasPermission(ctx, MODULES.SETTINGS, "update") && !hasPermission(ctx, MODULES.ADMIN, "configure")) {
    throw new Error("Vous n'êtes pas autorisé à gérer les activités / modules. (Paramètres requis)");
  }
}

/** Catalogue des activités disponibles (toutes). */
export async function listActivityCatalog(
  ctx: AuthzContext
): Promise<Result<typeof activities.$inferSelect[]>> {
  try {
    const rows = await db()
      .select()
      .from(activities)
      .where(eq(activities.active, true))
      .orderBy(activities.sortOrder);
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** Activités activées pour l'organisation. */
export async function listOrgActivities(
  ctx: AuthzContext
): Promise<Result<{ activityId: string; active: boolean }[]>> {
  try {
    const orgId = requireOrg(ctx);
    const rows = await db()
      .select({
        activityId: organizationActivities.activityId,
        active: organizationActivities.active,
      })
      .from(organizationActivities)
      .where(eq(organizationActivities.organizationId, orgId));
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** Active / désactive une activité pour l'organisation. */
export async function setOrgActivity(
  ctx: AuthzContext,
  activityId: string,
  active: boolean
): Promise<Result<{ activityId: string; active: boolean }>> {
  try {
    requireSetting(ctx);
    const orgId = requireOrg(ctx);
    await db()
      .insert(organizationActivities)
      .values({ organizationId: orgId, activityId, active, installed: active })
      .onConflictDoUpdate({
        target: [organizationActivities.organizationId, organizationActivities.activityId],
        set: { active, installed: active },
      });
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: "activities",
      action: active ? "activity.activate" : "activity.deactivate",
      entityType: "activity",
      entityId: activityId,
    });
    return ok({ activityId, active });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de mise à jour");
  }
}

/** Catalogue des modules disponibles. */
export async function listModuleCatalog(ctx: AuthzContext) {
  try {
    const rows = await db()
      .select()
      .from(modules)
      .where(eq(modules.active, true))
      .orderBy(modules.sortOrder);
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** Modules activés pour l'organisation. */
export async function listOrgModules(
  ctx: AuthzContext
): Promise<Result<{ moduleId: string; active: boolean }[]>> {
  try {
    const orgId = requireOrg(ctx);
    const rows = await db()
      .select({
        moduleId: organizationModules.moduleId,
        active: organizationModules.active,
      })
      .from(organizationModules)
      .where(eq(organizationModules.organizationId, orgId));
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** Active / désactive un module pour l'organisation. */
export async function setOrgModule(
  ctx: AuthzContext,
  moduleId: string,
  active: boolean
): Promise<Result<{ moduleId: string; active: boolean }>> {
  try {
    requireSetting(ctx);
    const orgId = requireOrg(ctx);
    await db()
      .insert(organizationModules)
      .values({ organizationId: orgId, moduleId, active })
      .onConflictDoUpdate({
        target: [organizationModules.organizationId, organizationModules.moduleId],
        set: { active },
      });
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: "settings",
      action: active ? "module.activate" : "module.deactivate",
      entityType: "module",
      entityId: moduleId,
    });
    return ok({ moduleId, active });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de mise à jour");
  }
}
