"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import { createAsset } from "./service";
import type { Result } from "@/lib/result";

export async function createAssetAction(
  form: FormData
): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || !ctx.organization) {
    return { ok: false, error: "Authentification requise." };
  }
  const name = String(form.get("name") || "").trim();
  if (!name) return { ok: false, error: "Nom de l'actif requis." };
  const cost = Number(form.get("cost") ?? 0);
  if (!Number.isFinite(cost) || cost <= 0) {
    return { ok: false, error: "Coût invalide." };
  }
  try {
    const res = await createAsset(ctx, {
      name,
      category: String(form.get("category") || "equipment"),
      reference: form.get("reference") ? String(form.get("reference")) : null,
      acquisitionDate: form.get("acquisitionDate")
        ? String(form.get("acquisitionDate"))
        : null,
      cost,
      residualValue: Number(form.get("residualValue") ?? 0),
      usefulLife: Number(form.get("usefulLife") ?? 5),
      method: String(form.get("method") || "linear"),
      location: form.get("location") ? String(form.get("location")) : null,
      notes: form.get("notes") ? String(form.get("notes")) : null,
    });
    if (res.ok) revalidatePath("/app/immobilisations");
    return res;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Données invalides." };
  }
}
