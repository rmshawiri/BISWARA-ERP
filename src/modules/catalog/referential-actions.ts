"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import { createUnit, createTax, createBrand } from "./service";
import type { Result } from "@/lib/result";

export async function createUnitAction(form: FormData): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization)
    return { ok: false, error: "Authentification requise." };
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Nom requis." };
  const res = await createUnit(ctx, name, String(form.get("symbol") ?? "").trim() || undefined);
  if (res.ok) revalidatePath("/app/catalogue");
  return res;
}

export async function createTaxAction(form: FormData): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization)
    return { ok: false, error: "Authentification requise." };
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Nom requis." };
  const res = await createTax(ctx, name, Number(form.get("rate") ?? 0));
  if (res.ok) revalidatePath("/app/catalogue");
  return res;
}

export async function createBrandAction(form: FormData): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization)
    return { ok: false, error: "Authentification requise." };
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Nom requis." };
  const res = await createBrand(ctx, name);
  if (res.ok) revalidatePath("/app/catalogue");
  return res;
}
