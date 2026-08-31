import "server-only";

import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { vehicles, deliveries, drivers, routes, fuelLogs, maintenanceLogs, incidents } from "@/db/schema";
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

/* ---- Extension : chauffeurs, tournées, carburant, maintenance, incidents ---- */

export async function listDrivers(ctx: AuthzContext) {
  requirePerm(ctx, "view");
  try {
    const rows = await db().select().from(drivers).where(eq(drivers.organizationId, ctx.organization!.id)).orderBy(drivers.name);
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

export async function createDriver(ctx: AuthzContext, input: { name: string; phone?: string | null; license?: string | null }) {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db().insert(drivers).values({ organizationId: orgId, name: input.name, phone: input.phone ?? null, license: input.license ?? null }).returning();
    if (!row) return err("Création impossible.");
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

export async function listRoutes(ctx: AuthzContext) {
  requirePerm(ctx, "view");
  try {
    const rows = await db().select().from(routes).where(eq(routes.organizationId, ctx.organization!.id)).orderBy(routes.routeDate);
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

export async function createRoute(ctx: AuthzContext, input: { name: string; vehicleId?: string | null; driverId?: string | null; routeDate?: string | null; origin?: string | null; destination?: string | null; notes?: string | null }) {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db().insert(routes).values({ organizationId: orgId, name: input.name, vehicleId: input.vehicleId ?? null, driverId: input.driverId ?? null, routeDate: input.routeDate ?? null, origin: input.origin ?? null, destination: input.destination ?? null, notes: input.notes ?? null }).returning();
    if (!row) return err("Création impossible.");
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

export async function listFuelLogs(ctx: AuthzContext) {
  requirePerm(ctx, "view");
  try {
    const rows = await db().select().from(fuelLogs).where(eq(fuelLogs.organizationId, ctx.organization!.id)).orderBy(fuelLogs.fuelDate);
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

export async function createFuelLog(ctx: AuthzContext, input: { vehicleId?: string | null; fuelDate?: string | null; liters: number; cost: number; odometer?: number | null; notes?: string | null }) {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db().insert(fuelLogs).values({ organizationId: orgId, vehicleId: input.vehicleId ?? null, fuelDate: input.fuelDate ?? null, liters: input.liters, cost: input.cost, odometer: input.odometer ?? null, notes: input.notes ?? null }).returning();
    if (!row) return err("Création impossible.");
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

export async function listMaintenanceLogs(ctx: AuthzContext) {
  requirePerm(ctx, "view");
  try {
    const rows = await db().select().from(maintenanceLogs).where(eq(maintenanceLogs.organizationId, ctx.organization!.id)).orderBy(maintenanceLogs.maintenanceDate);
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

export async function createMaintenanceLog(ctx: AuthzContext, input: { vehicleId?: string | null; maintenanceDate?: string | null; type?: string | null; cost: number; description?: string | null }) {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db().insert(maintenanceLogs).values({ organizationId: orgId, vehicleId: input.vehicleId ?? null, maintenanceDate: input.maintenanceDate ?? null, type: input.type ?? null, cost: input.cost, description: input.description ?? null }).returning();
    if (!row) return err("Création impossible.");
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

export async function listIncidents(ctx: AuthzContext) {
  requirePerm(ctx, "view");
  try {
    const rows = await db().select().from(incidents).where(eq(incidents.organizationId, ctx.organization!.id)).orderBy(incidents.createdAt);
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

export async function createIncident(ctx: AuthzContext, input: { vehicleId?: string | null; incidentDate?: string | null; type?: string | null; description?: string | null }) {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db().insert(incidents).values({ organizationId: orgId, vehicleId: input.vehicleId ?? null, incidentDate: input.incidentDate ?? null, type: input.type ?? null, description: input.description ?? null }).returning();
    if (!row) return err("Création impossible.");
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}
