"use server";

import { revalidatePath } from "next/cache";
import { getAuthzContext } from "@/server/auth";
import {
  suspendOrganization,
  reactivateOrganization,
  changeOrganizationPlan,
  activateSubscription,
  resetUserPassword,
  createOrganizationByAdmin,
} from "./service";
import type { Result } from "@/lib/result";

function requireCtx() {
  return getAuthzContext();
}

export async function suspendOrganizationAction(
  orgId: string
): Promise<Result<unknown>> {
  const ctx = await requireCtx();
  if (!ctx || !ctx.superAdmin) return { ok: false, error: "Accès refusé." };
  const res = await suspendOrganization(ctx, orgId);
  if (res.ok) revalidatePath("/admin/organisations");
  return res;
}

export async function reactivateOrganizationAction(
  orgId: string
): Promise<Result<unknown>> {
  const ctx = await requireCtx();
  if (!ctx || !ctx.superAdmin) return { ok: false, error: "Accès refusé." };
  const res = await reactivateOrganization(ctx, orgId);
  if (res.ok) revalidatePath("/admin/organisations");
  return res;
}

export async function changePlanAction(
  orgId: string,
  plan: string
): Promise<Result<unknown>> {
  const ctx = await requireCtx();
  if (!ctx || !ctx.superAdmin) return { ok: false, error: "Accès refusé." };
  const res = await changeOrganizationPlan(ctx, orgId, plan);
  if (res.ok) {
    revalidatePath("/admin/organisations");
    revalidatePath("/admin/abonnements");
  }
  return res;
}

export async function activateSubscriptionAction(
  orgId: string
): Promise<Result<unknown>> {
  const ctx = await requireCtx();
  if (!ctx || !ctx.superAdmin) return { ok: false, error: "Accès refusé." };
  const res = await activateSubscription(ctx, orgId);
  if (res.ok) {
    revalidatePath("/admin/organisations");
    revalidatePath("/admin/abonnements");
  }
  return res;
}

export async function resetPasswordAction(
  userId: string
): Promise<Result<{ temporaryPassword: string }>> {
  const ctx = await requireCtx();
  if (!ctx || !ctx.superAdmin) return { ok: false, error: "Accès refusé." };
  const res = await resetUserPassword(ctx, userId);
  if (res.ok) revalidatePath("/admin/utilisateurs");
  return res;
}

export async function createOrganizationAction(payload: {
  name: string;
  email: string;
  username: string;
  fullName: string;
  sector?: string;
}): Promise<Result<unknown>> {
  const ctx = await requireCtx();
  if (!ctx || !ctx.superAdmin) return { ok: false, error: "Accès refusé." };
  if (!payload.name?.trim() || !payload.email?.trim() || !payload.username?.trim()) {
    return { ok: false, error: "Nom, e-mail et nom d'utilisateur requis." };
  }
  const res = await createOrganizationByAdmin(ctx, payload);
  if (res.ok) revalidatePath("/admin/organisations");
  return res;
}
