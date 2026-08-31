import "server-only";

import { eq, desc, and } from "drizzle-orm";
import { db } from "@/db";
import { assets } from "@/db/schema";
import type { AuthzContext } from "@/types";
import { hasPermission } from "@/server/rbac";
import { logAudit } from "@/engines/audit";
import { MODULES, type PermissionAction } from "@/lib/constants";
import { err, ok, Result } from "@/lib/result";
import { autoPostDepreciationEntry } from "@/modules/accounting";
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

/** Sort un actif (vente / réforme / perte / vol / don). */
export async function disposeAsset(
  ctx: AuthzContext,
  id: string,
  reason: string
): Promise<Result<typeof assets.$inferSelect>> {
  requirePerm(ctx, "update");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db()
      .update(assets)
      .set({ status: "disposed", notes: `${reason}\n${Date.now().toString()}` })
      .where(and(eq(assets.id, id), eq(assets.organizationId, orgId)))
      .returning();
    if (!row) return err("Actif introuvable.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.ASSETS,
      action: "asset.dispose",
      entityType: "asset",
      entityId: id,
      newValue: { status: "disposed", reason },
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de sortie");
  }
}

/** Poste l'écriture d'amortissement annuel d'un actif (best-effort). */
export async function postDepreciation(ctx: AuthzContext, id: string) {
  requirePerm(ctx, "update");
  const orgId = ctx.organization!.id;
  try {
    const [asset] = await db().select().from(assets).where(and(eq(assets.id, id), eq(assets.organizationId, orgId))).limit(1);
    if (!asset) return err("Actif introuvable.");
    const amort = amortizationFor(asset);
    const res = await autoPostDepreciationEntry(ctx, amort.annual, `Amortissement ${asset.name}`);
    if (res.ok) {
      await logAudit({ userId: ctx.user.id, userName: ctx.user.fullName, organizationId: orgId, module: MODULES.ASSETS, action: "asset.amortization", entityType: "asset", entityId: id, newValue: { annual: amort.annual } });
    }
    return res;
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur d'amortissement");
  }
}
