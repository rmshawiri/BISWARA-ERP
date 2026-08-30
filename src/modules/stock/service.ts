import "server-only";

import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import { warehouses, stockMovements } from "@/db/schema";
import type { AuthzContext } from "@/types";
import { hasPermission } from "@/server/rbac";
import { logAudit } from "@/engines/audit";
import { MODULES, type PermissionAction } from "@/lib/constants";
import { err, ok, Result } from "@/lib/result";
import {
  CreateStockMovementInput,
  CreateWarehouseInput,
} from "./validation";

function requirePerm(ctx: AuthzContext, action: PermissionAction): void {
  if (!hasPermission(ctx, MODULES.STOCK, action)) {
    throw new Error("Vous n'êtes pas autorisé à effectuer cette action.");
  }
}

export async function listWarehouses(
  ctx: AuthzContext
): Promise<Result<typeof warehouses.$inferSelect[]>> {
  requirePerm(ctx, "view");
  const orgId = ctx.organization!.id;
  try {
    const result = await db()
      .select()
      .from(warehouses)
      .where(eq(warehouses.organizationId, orgId));
    return ok(result);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

export async function createWarehouse(
  ctx: AuthzContext,
  input: CreateWarehouseInput
): Promise<Result<typeof warehouses.$inferSelect>> {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db()
      .insert(warehouses)
      .values({ ...input, organizationId: orgId })
      .returning();
    if (!row) return err("Création impossible.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.STOCK,
      action: "warehouse.create",
      entityType: "warehouse",
      entityId: row.id,
      newValue: { name: row.name },
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

export async function listMovements(
  ctx: AuthzContext,
  productId?: string
): Promise<Result<typeof stockMovements.$inferSelect[]>> {
  requirePerm(ctx, "view");
  const orgId = ctx.organization!.id;
  try {
    const conds = [eq(stockMovements.organizationId, orgId)];
    if (productId) conds.push(eq(stockMovements.productId, productId));
    const result = await db()
      .select()
      .from(stockMovements)
      .where(and(...conds))
      .orderBy(desc(stockMovements.createdAt))
      .limit(100);
    return ok(result);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

export async function createStockMovement(
  ctx: AuthzContext,
  input: CreateStockMovementInput
): Promise<Result<typeof stockMovements.$inferSelect>> {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db()
      .insert(stockMovements)
      .values({ ...input, organizationId: orgId })
      .returning();
    if (!row) return err("Création impossible.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.STOCK,
      action: `movement.${input.type}`,
      entityType: "stock_movement",
      entityId: row.id,
      newValue: { productId: input.productId, quantity: input.quantity },
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

/** Stock disponible par produit (somme des entrées - sorties). */
export async function stockLevels(
  ctx: AuthzContext
): Promise<Result<{ productId: string; qty: number }[]>> {
  requirePerm(ctx, "view");
  const orgId = ctx.organization!.id;
  try {
    const rows = await db()
      .select({
        productId: stockMovements.productId,
        qty: sql<number>`sum(case when ${stockMovements.type} in ('in','adjust','inventory') then ${stockMovements.quantity} else -${stockMovements.quantity} end)`,
      })
      .from(stockMovements)
      .where(eq(stockMovements.organizationId, orgId))
      .groupBy(stockMovements.productId);
    return ok(rows.map((r) => ({ productId: r.productId, qty: Number(r.qty ?? 0) })));
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}
