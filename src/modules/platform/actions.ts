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
  updateUserRole,
  createSuperAdmin,
  setSubscriptionTrial,
  setSubscriptionDiscount,
  recordSubscriptionPayment,
  updateSubscriptionPaymentStatus,
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

export async function updateUserRoleAction(
  userId: string,
  role?: string,
  status?: string
): Promise<Result<unknown>> {
  const ctx = await requireCtx();
  if (!ctx || !ctx.superAdmin) return { ok: false, error: "Accès refusé." };
  const res = await updateUserRole(ctx, userId, { role, status });
  if (res.ok) revalidatePath("/admin/utilisateurs");
  return res;
}

export async function setSubscriptionTrialAction(
  orgId: string,
  days: number
): Promise<Result<unknown>> {
  const ctx = await requireCtx();
  if (!ctx || !ctx.superAdmin) return { ok: false, error: "Accès refusé." };
  const res = await setSubscriptionTrial(ctx, orgId, days);
  if (res.ok) revalidatePath("/admin/abonnements");
  return res;
}

export async function setSubscriptionDiscountAction(
  orgId: string,
  percent: number
): Promise<Result<unknown>> {
  const ctx = await requireCtx();
  if (!ctx || !ctx.superAdmin) return { ok: false, error: "Accès refusé." };
  const res = await setSubscriptionDiscount(ctx, orgId, percent);
  if (res.ok) revalidatePath("/admin/abonnements");
  return res;
}

export async function recordSubscriptionPaymentAction(
  orgId: string,
  payload: { amount: number; method: string; reference?: string; note?: string }
): Promise<Result<unknown>> {
  const ctx = await requireCtx();
  if (!ctx || !ctx.superAdmin) return { ok: false, error: "Accès refusé." };
  const res = await recordSubscriptionPayment(ctx, orgId, payload);
  if (res.ok) revalidatePath("/admin/paiements");
  return res;
}

export async function updateSubscriptionPaymentStatusAction(
  paymentId: string,
  status: string
): Promise<Result<unknown>> {
  const ctx = await requireCtx();
  if (!ctx || !ctx.superAdmin) return { ok: false, error: "Accès refusé." };
  const res = await updateSubscriptionPaymentStatus(ctx, paymentId, status);
  if (res.ok) {
    revalidatePath("/admin/paiements");
    revalidatePath("/admin/revenus");
  }
  return res;
}

export async function createSuperAdminAction(payload: {
  email: string;
  fullName: string;
  username: string;
}): Promise<Result<unknown>> {
  const ctx = await requireCtx();
  if (!ctx || !ctx.superAdmin) return { ok: false, error: "Accès refusé." };
  if (!payload.email?.trim() || !payload.fullName?.trim() || !payload.username?.trim()) {
    return { ok: false, error: "E-mail, nom et identifiant requis." };
  }
  const res = await createSuperAdmin(ctx, payload);
  if (res.ok) revalidatePath("/admin/superadmins");
  return res;
}
