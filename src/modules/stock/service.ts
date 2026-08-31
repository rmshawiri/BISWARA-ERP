import "server-only";

import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import { warehouses, stockMovements } from "@/db/schema";
import type { AuthzContext } from "@/types";
import { hasPermission } from "@/server/rbac";
import { logAudit } from "@/engines/audit";
import { MODULES, type PermissionAction } from "@/lib/constants";
import { err, ok, Result } from "@/lib/result";
import { notifyOrgUsers } from "@/engines/notify-org";
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
    // Alerte stock faible (best-effort).
    try {
      const [lvl] = await db()
        .select({ q: sql<number>`sum(case when ${stockMovements.type} in ('in','adjust','inventory') then ${stockMovements.quantity} else -${stockMovements.quantity} end)` })
        .from(stockMovements)
        .where(and(eq(stockMovements.organizationId, orgId), eq(stockMovements.productId, input.productId)));
      const qty = Number(lvl?.q ?? 0);
      if (qty <= 10) {
        await notifyOrgUsers(orgId, "Stock faible", `Le produit atteint ${qty} unité(s) restante(s).`, "/app/stock", MODULES.STOCK);
      }
    } catch { /* non bloquant */ }
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

/** Transfert entre deux dépôts (mouvement sortie + entrée). */
export async function recordTransfer(
  ctx: AuthzContext,
  input: {
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: number;
    reference?: string | null;
  }
): Promise<Result<boolean>> {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const date = new Date().toISOString().slice(0, 10);
    await db().insert(stockMovements).values({
      organizationId: orgId,
      productId: input.productId,
      warehouseId: input.fromWarehouseId,
      type: "out",
      quantity: input.quantity,
      reference: input.reference ?? null,
      date,
    });
    await db().insert(stockMovements).values({
      organizationId: orgId,
      productId: input.productId,
      warehouseId: input.toWarehouseId,
      type: "in",
      quantity: input.quantity,
      reference: input.reference ?? null,
      date,
    });
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.STOCK,
      action: "movement.transfer",
      entityType: "stock_movement",
      entityId: input.productId,
      newValue: { from: input.fromWarehouseId, to: input.toWarehouseId, qty: input.quantity },
    });
    return ok(true);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de transfert");
  }
}
