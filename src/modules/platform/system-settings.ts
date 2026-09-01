import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import type { AuthzContext } from "@/types";
import { err, ok, Result } from "@/lib/result";

function requireSuperAdmin(ctx: AuthzContext) {
  if (!ctx.superAdmin) throw new Error("Accès réservé au Super Admin.");
}

export async function listSystemSettings(ctx: AuthzContext) {
  try {
    requireSuperAdmin(ctx);
    const rows = await db().select().from(systemSettings);
    return ok(rows as { key: string; value: string | null }[]);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

export async function updateSystemSetting(ctx: AuthzContext, key: string, value: string) {
  try {
    requireSuperAdmin(ctx);
    const [row] = await db()
      .insert(systemSettings)
      .values({ key, value })
      .onConflictDoUpdate({ target: systemSettings.key, set: { value } })
      .returning();
    if (!row) return err("Enregistrement impossible.");
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de mise à jour");
  }
}

/** Lit une valeur système (pour l'affichage public, sans droit Super Admin). */
export async function readSystemSetting(key: string): Promise<string | null> {
  try {
    const rows = await db().select({ value: systemSettings.value }).from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
    return rows[0]?.value ?? null;
  } catch {
    return null;
  }
}
