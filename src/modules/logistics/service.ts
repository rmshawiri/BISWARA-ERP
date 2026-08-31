import "server-only";

import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { vehicles, deliveries } from "@/db/schema";
import type { AuthzContext } from "@/types";
import { hasPermission } from "@/server/rbac";
import { logAudit } from "@/engines/audit";
import { MODULES, type PermissionAction } from "@/lib/constants";
import { err, ok, Result } from "@/lib/result";

function requirePerm(ctx: AuthzContext, action: PermissionAction): void {
  if (!hasPermission(ctx, MODULES.LOGISTICS, action)) {
    throw new Error("Vous n'êtes pas autorisé à effectuer cette action.");
  }
}

export async function listVehicles(
  ctx: AuthzContext
): Promise<Result<typeof vehicles.$inferSelect[]>> {
  requirePerm(ctx, "view");
  const orgId = ctx.organization!.id;
  try {
    const rows = await db()
      .select()
      .from(vehicles)
      .where(eq(vehicles.organizationId, orgId))
      .orderBy(desc(vehicles.createdAt));
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

export async function createVehicle(
  ctx: AuthzContext,
  input: { plate: string; model?: string | null; capacity?: string | null }
): Promise<Result<typeof vehicles.$inferSelect>> {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db()
      .insert(vehicles)
      .values({ ...input, organizationId: orgId })
      .returning();
    if (!row) return err("Création impossible.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.LOGISTICS,
      action: "vehicle.create",
      entityType: "vehicle",
      entityId: row.id,
      newValue: { plate: row.plate },
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

export async function listDeliveries(
  ctx: AuthzContext
): Promise<Result<typeof deliveries.$inferSelect[]>> {
  requirePerm(ctx, "view");
  const orgId = ctx.organization!.id;
  try {
    const rows = await db()
      .select()
      .from(deliveries)
      .where(eq(deliveries.organizationId, orgId))
      .orderBy(desc(deliveries.createdAt));
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

export async function createDelivery(
  ctx: AuthzContext,
  input: {
    vehicleId?: string | null;
    reference?: string | null;
    customerName?: string | null;
    origin?: string | null;
    destination?: string | null;
    scheduledDate?: string | null;
    notes?: string | null;
  }
): Promise<Result<typeof deliveries.$inferSelect>> {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db()
      .insert(deliveries)
      .values({ ...input, organizationId: orgId })
      .returning();
    if (!row) return err("Création impossible.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.LOGISTICS,
      action: "delivery.create",
      entityType: "delivery",
      entityId: row.id,
      newValue: { reference: row.reference ?? row.customerName },
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}
