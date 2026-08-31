"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import { createDriver, createRoute, createFuelLog, createMaintenanceLog, createIncident } from "./service";
import type { Result } from "@/lib/result";

export async function createDriverAction(payload: { name: string; phone?: string | null; license?: string | null }): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) return { ok: false, error: "Authentification requise." };
  if (!payload.name?.trim()) return { ok: false, error: "Nom requis." };
  const res = await createDriver(ctx, { name: payload.name.trim(), phone: payload.phone || null, license: payload.license || null });
  if (res.ok) revalidatePath("/app/logistique");
  return res;
}

export async function createRouteAction(payload: { name: string; vehicleId?: string | null; driverId?: string | null; routeDate?: string | null; origin?: string | null; destination?: string | null; notes?: string | null }): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) return { ok: false, error: "Authentification requise." };
  if (!payload.name?.trim()) return { ok: false, error: "Nom requis." };
  const res = await createRoute(ctx, { name: payload.name.trim(), vehicleId: payload.vehicleId || null, driverId: payload.driverId || null, routeDate: payload.routeDate || null, origin: payload.origin || null, destination: payload.destination || null, notes: payload.notes || null });
  if (res.ok) revalidatePath("/app/logistique");
  return res;
}

export async function createFuelLogAction(payload: { vehicleId?: string | null; liters: number; cost: number; odometer?: number | null; notes?: string | null }): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) return { ok: false, error: "Authentification requise." };
  if (!(payload.liters > 0)) return { ok: false, error: "Litres invalides." };
  const res = await createFuelLog(ctx, { vehicleId: payload.vehicleId || null, fuelDate: new Date().toISOString().slice(0, 10), liters: payload.liters, cost: payload.cost, odometer: payload.odometer ?? null, notes: payload.notes || null });
  if (res.ok) revalidatePath("/app/logistique");
  return res;
}

export async function createMaintenanceAction(payload: { vehicleId?: string | null; type?: string | null; cost: number; description?: string | null }): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) return { ok: false, error: "Authentification requise." };
  const res = await createMaintenanceLog(ctx, { vehicleId: payload.vehicleId || null, maintenanceDate: new Date().toISOString().slice(0, 10), type: payload.type || null, cost: payload.cost, description: payload.description || null });
  if (res.ok) revalidatePath("/app/logistique");
  return res;
}

export async function createIncidentAction(payload: { vehicleId?: string | null; type?: string | null; description?: string | null }): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) return { ok: false, error: "Authentification requise." };
  const res = await createIncident(ctx, { vehicleId: payload.vehicleId || null, incidentDate: new Date().toISOString().slice(0, 10), type: payload.type || null, description: payload.description || null });
  if (res.ok) revalidatePath("/app/logistique");
  return res;
}
