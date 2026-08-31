import "server-only";

import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { assets } from "@/db/schema";
import type { AuthzContext } from "@/types";
import { hasPermission } from "@/server/rbac";
import { logAudit } from "@/engines/audit";
import { MODULES, type PermissionAction } from "@/lib/constants";
import { err, ok, Result } from "@/lib/result";
import { linearAmortization, type AmortizationResult } from "./logic";

function requirePerm(ctx: AuthzContext, action: PermissionAction): void {
  if (!hasPermission(ctx, MODULES.ASSETS, action)) {
    throw new Error("Vous n'êtes pas autorisé à effectuer cette action.");
  }
}

export async function listAssets(
  ctx: AuthzContext
): Promise<Result<typeof assets.$inferSelect[]>> {
  requirePerm(ctx, "view");
  const orgId = ctx.organization!.id;
  try {
    const rows = await db()
      .select()
      .from(assets)
      .where(eq(assets.organizationId, orgId))
      .orderBy(desc(assets.createdAt));
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

export async function createAsset(
  ctx: AuthzContext,
  input: {
    name: string;
    category: string;
    reference?: string | null;
    acquisitionDate?: string | null;
    cost: number;
    residualValue?: number;
    usefulLife: number;
    method: string;
    location?: string | null;
    notes?: string | null;
  }
): Promise<Result<typeof assets.$inferSelect>> {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db()
      .insert(assets)
      .values({ ...input, organizationId: orgId })
      .returning();
    if (!row) return err("Création impossible.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.ASSETS,
      action: "asset.create",
      entityType: "asset",
      entityId: row.id,
      newValue: { name: row.name, cost: Number(row.cost) },
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

/** Calcule l'amortissement linéaire d'un actif (règles métier). */
export function amortizationFor(asset: {
  cost: number;
  usefulLife: number;
  residualValue?: number | null;
  method?: string;
}): AmortizationResult {
  return linearAmortization({
    cost: Number(asset.cost),
    usefulLife: Number(asset.usefulLife),
    residualValue: Number(asset.residualValue ?? 0),
  });
}
