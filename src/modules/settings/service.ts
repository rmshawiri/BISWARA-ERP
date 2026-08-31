import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations, profiles } from "@/db/schema";
import type { AuthzContext } from "@/types";
import { hasPermission } from "@/server/rbac";
import { logAudit } from "@/engines/audit";
import { MODULES } from "@/lib/constants";
import { err, ok, Result } from "@/lib/result";
import type { UpdateOrganizationInput, UpdateUserInput } from "./validation";

function requireSetting(ctx: AuthzContext, action: "view" | "update"): void {
  if (!hasPermission(ctx, MODULES.SETTINGS, action)) {
    throw new Error("Vous n'êtes pas autorisé à effectuer cette action.");
  }
}

/** Met à jour les informations de l'organisation (nom, slogan, coordonnées). */
export async function updateOrganization(
  ctx: AuthzContext,
  input: UpdateOrganizationInput
): Promise<Result<typeof organizations.$inferSelect>> {
  requireSetting(ctx, "update");
  const orgId = ctx.organization?.id;
  if (!orgId) return err("Organisation introuvable.");
  try {
    const [row] = await db()
      .update(organizations)
      .set({
        name: input.name,
        slogan: input.slogan || null,
        city: input.city || null,
        currency: input.currency || "KMF",
        country: input.country || "KM",
      })
      .where(eq(organizations.id, orgId))
      .returning();
    if (!row) return err("Mise à jour impossible.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.SETTINGS,
      action: "organization.update",
      entityType: "organization",
      entityId: orgId,
      newValue: { name: row.name, currency: row.currency },
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de mise à jour");
  }
}

/** Met à jour le profil de l'utilisateur connecté. */
export async function updateUser(
  ctx: AuthzContext,
  input: UpdateUserInput
): Promise<Result<typeof profiles.$inferSelect>> {
  requireSetting(ctx, "update");
  try {
    const [row] = await db()
      .update(profiles)
      .set({ fullName: input.fullName, phone: input.phone || null })
      .where(eq(profiles.id, ctx.user.id))
      .returning();
    if (!row) return err("Mise à jour impossible.");
    await logAudit({
      userId: ctx.user.id,
      userName: row.fullName,
      organizationId: ctx.organization?.id ?? null,
      module: MODULES.SETTINGS,
      action: "profile.update",
      entityType: "profile",
      entityId: row.id,
      newValue: { fullName: row.fullName },
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de mise à jour");
  }
}
