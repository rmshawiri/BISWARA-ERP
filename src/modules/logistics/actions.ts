"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import { createVehicle, createDelivery } from "./service";
import type { Result } from "@/lib/result";

export async function createVehicleAction(
  form: FormData
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.organization) {
    return { ok: false, error: "Authentification requise." };
  }
  const plate = String(form.get("plate") || "").trim();
  if (!plate) return { ok: false, error: "Immatriculation requise." };
  try {
    const res = await createVehicle(ctx, {
      plate,
      model: form.get("model") ? String(form.get("model")) : null,
      capacity: form.get("capacity") ? String(form.get("capacity")) : null,
    });
    if (res.ok) revalidatePath("/app/logistique");
    return res;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Données invalides." };
  }
}

export async function createDeliveryAction(
  form: FormData
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.organization) {
    return { ok: false, error: "Authentification requise." };
  }
  try {
    const res = await createDelivery(ctx, {
      vehicleId: form.get("vehicleId") ? String(form.get("vehicleId")) : null,
      reference: form.get("reference") ? String(form.get("reference")) : null,
      customerName: form.get("customerName") ? String(form.get("customerName")) : null,
      origin: form.get("origin") ? String(form.get("origin")) : null,
      destination: form.get("destination") ? String(form.get("destination")) : null,
      scheduledDate: form.get("scheduledDate") ? String(form.get("scheduledDate")) : null,
      notes: form.get("notes") ? String(form.get("notes")) : null,
    });
    if (res.ok) revalidatePath("/app/logistique");
    return res;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Données invalides." };
  }
}
