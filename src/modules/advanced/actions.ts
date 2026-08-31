"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import { addCurrency, setDefaultCurrency, addPaymentMethod, togglePaymentMethod, createApiKey, revokeApiKey, addWebhook, removeWebhook } from "./service";
import type { Result } from "@/lib/result";

export async function addCurrencyAction(code: string, name: string, rateToKmf: number): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) return { ok: false, error: "Authentification requise." };
  if (!code?.trim()) return { ok: false, error: "Code requis." };
  const res = await addCurrency(ctx, code.trim().toUpperCase(), name, rateToKmf || 1);
  if (res.ok) revalidatePath("/app/parametres");
  return res;
}
export async function setDefaultCurrencyAction(id: string): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) return { ok: false, error: "Authentification requise." };
  const res = await setDefaultCurrency(ctx, id);
  if (res.ok) revalidatePath("/app/parametres");
  return res;
}
export async function addPaymentMethodAction(name: string, code: string): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) return { ok: false, error: "Authentification requise." };
  if (!name?.trim()) return { ok: false, error: "Nom requis." };
  const res = await addPaymentMethod(ctx, name.trim(), code?.trim());
  if (res.ok) revalidatePath("/app/parametres");
  return res;
}
export async function togglePaymentMethodAction(id: string, active: boolean): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) return { ok: false, error: "Authentification requise." };
  const res = await togglePaymentMethod(ctx, id, active);
  if (res.ok) revalidatePath("/app/parametres");
  return res;
}
export async function createApiKeyAction(label: string): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) return { ok: false, error: "Authentification requise." };
  const res = await createApiKey(ctx, label?.trim() || "Clé");
  if (res.ok) revalidatePath("/app/parametres");
  return res;
}
export async function revokeApiKeyAction(id: string): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) return { ok: false, error: "Authentification requise." };
  const res = await revokeApiKey(ctx, id);
  if (res.ok) revalidatePath("/app/parametres");
  return res;
}
export async function addWebhookAction(event: string, url: string): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) return { ok: false, error: "Authentification requise." };
  if (!url?.trim()) return { ok: false, error: "URL requise." };
  const res = await addWebhook(ctx, event || "all", url.trim());
  if (res.ok) revalidatePath("/app/parametres");
  return res;
}
export async function removeWebhookAction(id: string): Promise<Result<unknown>> {
  const ctx = await getAuthzContext();
  if (!ctx || ctx.superAdmin || !ctx.organization) return { ok: false, error: "Authentification requise." };
  const res = await removeWebhook(ctx, id);
  if (res.ok) revalidatePath("/app/parametres");
  return res;
}
