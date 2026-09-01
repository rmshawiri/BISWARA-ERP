import "server-only";

import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { organizations, profiles, subscriptions, auditLogs, subscriptionPayments } from "@/db/schema";
import type { AuthzContext } from "@/types";
import { err, ok, Result } from "@/lib/result";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/engines/audit";

function requireSuperAdmin(ctx: AuthzContext): void {
  if (!ctx.superAdmin) {
    throw new Error("Accès réservé à l'administration de la plateforme.");
  }
}

export interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  role: string;
  status: string;
  organizationId: string | null;
  orgName: string | null;
  createdAt: Date;
}

export interface AdminSubscriptionPayment {
  id: string;
  organizationId: string | null;
  orgName: string | null;
  plan: string | null;
  amount: number;
  currency: string;
  method: string;
  status: string;
  reference: string | null;
  note: string | null;
  paidAt: Date | null;
  createdAt: Date;
}

/** Liste les paiements d'abonnements (Super Admin). */
export async function listSubscriptionPayments(
  ctx: AuthzContext,
  opts: { status?: string } = {}
): Promise<Result<AdminSubscriptionPayment[]>> {
  requireSuperAdmin(ctx);
  try {
    const base = db()
      .select({
        id: subscriptionPayments.id,
        organizationId: subscriptionPayments.organizationId,
        orgName: organizations.name,
        plan: subscriptions.plan,
        amount: subscriptionPayments.amount,
        currency: subscriptionPayments.currency,
        method: subscriptionPayments.method,
        status: subscriptionPayments.status,
        reference: subscriptionPayments.reference,
        note: subscriptionPayments.note,
        paidAt: subscriptionPayments.paidAt,
        createdAt: subscriptionPayments.createdAt,
      })
      .from(subscriptionPayments)
      .leftJoin(subscriptions, eq(subscriptionPayments.subscriptionId, subscriptions.id))
      .leftJoin(organizations, eq(subscriptionPayments.organizationId, organizations.id))
      .orderBy(desc(subscriptionPayments.createdAt))
      .limit(200);
    const rows = opts.status
      ? await db()
          .select({
            id: subscriptionPayments.id,
            organizationId: subscriptionPayments.organizationId,
            orgName: organizations.name,
            plan: subscriptions.plan,
            amount: subscriptionPayments.amount,
            currency: subscriptionPayments.currency,
            method: subscriptionPayments.method,
            status: subscriptionPayments.status,
            reference: subscriptionPayments.reference,
            note: subscriptionPayments.note,
            paidAt: subscriptionPayments.paidAt,
            createdAt: subscriptionPayments.createdAt,
          })
          .from(subscriptionPayments)
          .leftJoin(subscriptions, eq(subscriptionPayments.subscriptionId, subscriptions.id))
          .leftJoin(organizations, eq(subscriptionPayments.organizationId, organizations.id))
          .where(eq(subscriptionPayments.status, opts.status))
          .orderBy(desc(subscriptionPayments.createdAt))
          .limit(200)
      : await base;
    return ok(rows.map((r) => ({ ...r, amount: Number(r.amount) })));
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** Enregistre un paiement d'abonnement (Super Admin). */
export async function recordSubscriptionPayment(
  ctx: AuthzContext,
  orgId: string,
  input: { amount: number; method: string; reference?: string; note?: string }
): Promise<Result<{ id: string }>> {
  requireSuperAdmin(ctx);
  const amount = Math.round(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) return err("Montant invalide.");
  try {
    const [sub] = await db()
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.organizationId, orgId))
      .limit(1);
    if (!sub) return err("Aucun abonnement pour cette organisation.");
    const [row] = await db()
      .insert(subscriptionPayments)
      .values({
        subscriptionId: sub.id,
        organizationId: orgId,
        amount,
        method: input.method || "cash",
        reference: input.reference ?? null,
        note: input.note ?? null,
        status: "pending",
      })
      .returning({ id: subscriptionPayments.id });
    if (!row) return err("Enregistrement impossible.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: "subscription",
      action: "subscription.payment.record",
      entityType: "subscription_payment",
      entityId: row.id,
      newValue: { amount, method: input.method },
    });
    return ok({ id: row.id });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur d'enregistrement");
  }
}

/** Valide / refuse / annule un paiement d'abonnement (Super Admin). */
export async function updateSubscriptionPaymentStatus(
  ctx: AuthzContext,
  paymentId: string,
  status: string
): Promise<Result<{ id: string }>> {
  requireSuperAdmin(ctx);
  if (!["pending", "validated", "refused", "canceled"].includes(status)) {
    return err("Statut de paiement invalide.");
  }
  try {
    const set: Record<string, unknown> = { status };
    if (status === "validated") set.paidAt = new Date();
    const [row] = await db()
      .update(subscriptionPayments)
      .set(set)
      .where(eq(subscriptionPayments.id, paymentId))
      .returning({ id: subscriptionPayments.id, organizationId: subscriptionPayments.organizationId });
    if (!row) return err("Paiement introuvable.");
    // Si validé : on active l'abonnement de l'organisation.
    if (status === "validated" && row.organizationId) {
      await db()
        .update(subscriptions)
        .set({ status: "active", endedAt: null })
        .where(eq(subscriptions.organizationId, row.organizationId));
    }
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: row.organizationId,
      module: "subscription",
      action: "subscription.payment.status",
      entityType: "subscription_payment",
      entityId: paymentId,
      newValue: { status },
    });
    return ok({ id: row.id });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de mise à jour");
  }
}

/** Statistiques de revenus (paiements validés) — Super Admin. */
export async function platformRevenue(
  ctx: AuthzContext
): Promise<
  Result<{
    total: number;
    month: number;
    year: number;
    byPlan: Record<string, number>;
    last6Months: { label: string; amount: number }[];
  }>
> {
  requireSuperAdmin(ctx);
  try {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalRow, monthRow, yearRow, byPlanRows, monthRows] = await Promise.all([
      db().select({ s: sql<number>`coalesce(sum(${subscriptionPayments.amount}),0)::int` }).from(subscriptionPayments).where(eq(subscriptionPayments.status, "validated")),
      db()
        .select({ s: sql<number>`coalesce(sum(${subscriptionPayments.amount}),0)::int` })
        .from(subscriptionPayments)
        .where(and(eq(subscriptionPayments.status, "validated"), sql`${subscriptionPayments.paidAt} >= ${monthStart}`)),
      db()
        .select({ s: sql<number>`coalesce(sum(${subscriptionPayments.amount}),0)::int` })
        .from(subscriptionPayments)
        .where(and(eq(subscriptionPayments.status, "validated"), sql`${subscriptionPayments.paidAt} >= ${yearStart}`)),
      db()
        .select({ plan: subscriptions.plan, s: sql<number>`coalesce(sum(${subscriptionPayments.amount}),0)::int` })
        .from(subscriptionPayments)
        .leftJoin(subscriptions, eq(subscriptionPayments.subscriptionId, subscriptions.id))
        .where(eq(subscriptionPayments.status, "validated"))
        .groupBy(subscriptions.plan),
      db()
        .select({ paidAt: subscriptionPayments.paidAt, s: sql<number>`coalesce(sum(${subscriptionPayments.amount}),0)::int` })
        .from(subscriptionPayments)
        .where(eq(subscriptionPayments.status, "validated"))
        .groupBy(subscriptionPayments.paidAt),
    ]);

    const byPlan: Record<string, number> = {};
    for (const r of byPlanRows) byPlan[r.plan ?? "free"] = Number(r.s);

    // Agrégation par mois (6 derniers mois).
    const buckets = new Map<string, number>();
    for (const r of monthRows) {
      if (!r.paidAt) continue;
      const d = new Date(r.paidAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets.set(key, (buckets.get(key) ?? 0) + Number(r.s));
    }
    const last6Months: { label: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      last6Months.push({ label: d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }), amount: buckets.get(key) ?? 0 });
    }

    return ok({
      total: Number(totalRow[0]?.s ?? 0),
      month: Number(monthRow[0]?.s ?? 0),
      year: Number(yearRow[0]?.s ?? 0),
      byPlan,
      last6Months,
    });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de calcul des revenus");
  }
}

export interface AdminSubscription {
  id: string;
  organizationId: string | null;
  plan: string;
  status: string;
  orgName: string | null;
  startedAt: Date;
  endedAt: Date | null;
  trialEndsAt: Date | null;
  discountPercent: number;
  createdAt: Date;
}

/** Liste toutes les organisations (Super Admin). */
export async function listOrganizations(
  ctx: AuthzContext
): Promise<Result<typeof organizations.$inferSelect[]>> {
  requireSuperAdmin(ctx);
  try {
    const result = await db()
      .select()
      .from(organizations)
      .orderBy(desc(organizations.createdAt))
      .limit(200);
    return ok(result);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** Liste tous les utilisateurs avec leur organisation liée. */
export async function listUsers(
  ctx: AuthzContext
): Promise<Result<AdminUser[]>> {
  requireSuperAdmin(ctx);
  try {
    const rows = await db()
      .select({
        id: profiles.id,
        username: profiles.username,
        fullName: profiles.fullName,
        email: profiles.email,
        role: profiles.role,
        status: profiles.status,
        organizationId: profiles.organizationId,
        orgName: organizations.name,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .leftJoin(organizations, eq(profiles.organizationId, organizations.id))
      .orderBy(desc(profiles.createdAt))
      .limit(200);
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** Liste tous les abonnements avec l'organisation liée. */
export async function listSubscriptions(
  ctx: AuthzContext
): Promise<Result<AdminSubscription[]>> {
  requireSuperAdmin(ctx);
  try {
    const rows = await db()
      .select({
        id: subscriptions.id,
        organizationId: subscriptions.organizationId,
        plan: subscriptions.plan,
        status: subscriptions.status,
        orgName: organizations.name,
        startedAt: subscriptions.startedAt,
        endedAt: subscriptions.endedAt,
        trialEndsAt: subscriptions.trialEndsAt,
        discountPercent: subscriptions.discountPercent,
        createdAt: subscriptions.createdAt,
      })
      .from(subscriptions)
      .leftJoin(organizations, eq(subscriptions.organizationId, organizations.id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(200);
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** Historique des événements d'abonnement (module « subscription »). */
export async function listSubscriptionActivity(
  ctx: AuthzContext,
  orgId?: string
): Promise<Result<typeof auditLogs.$inferSelect[]>> {
  requireSuperAdmin(ctx);
  try {
    const base = db()
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.module, "subscription"))
      .orderBy(desc(auditLogs.createdAt))
      .limit(80);
    const rows = orgId
      ? await db()
          .select()
          .from(auditLogs)
          .where(and(eq(auditLogs.module, "subscription"), eq(auditLogs.organizationId, orgId)))
          .orderBy(desc(auditLogs.createdAt))
          .limit(80)
      : await base;
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** Prolonge / fixe la date de fin d'essai d'un abonnement (Super Admin). */
export async function setSubscriptionTrial(
  ctx: AuthzContext,
  orgId: string,
  days: number
): Promise<Result<{ trialEndsAt: Date }>> {
  requireSuperAdmin(ctx);
  if (!Number.isFinite(days) || days < 0 || days > 3650) {
    return err("Durée d'essai invalide (jours).");
  }
  try {
    const trialEndsAt = new Date(Date.now() + days * 86_400_000);
    const [row] = await db()
      .update(subscriptions)
      .set({ trialEndsAt, endedAt: null })
      .where(eq(subscriptions.organizationId, orgId))
      .returning({ trialEndsAt: subscriptions.trialEndsAt });
    if (!row) return err("Abonnement introuvable pour cette organisation.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: "subscription",
      action: "subscription.set_trial",
      entityType: "organization",
      entityId: orgId,
      newValue: { trialDays: days, trialEndsAt: trialEndsAt.toISOString() },
    });
    return ok({ trialEndsAt });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de prolongation d'essai");
  }
}

/** Applique une remise (0–100 %) sur l'abonnement d'une organisation (Super Admin). */
export async function setSubscriptionDiscount(
  ctx: AuthzContext,
  orgId: string,
  percent: number
): Promise<Result<{ discountPercent: number }>> {
  requireSuperAdmin(ctx);
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    return err("Remise invalide (0 à 100).");
  }
  try {
    const value = Math.round(percent);
    const [row] = await db()
      .update(subscriptions)
      .set({ discountPercent: value })
      .where(eq(subscriptions.organizationId, orgId))
      .returning({ discountPercent: subscriptions.discountPercent });
    if (!row) return err("Abonnement introuvable pour cette organisation.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: "subscription",
      action: "subscription.set_discount",
      entityType: "organization",
      entityId: orgId,
      newValue: { discountPercent: value },
    });
    return ok({ discountPercent: value });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de remise");
  }
}

/** Statistiques globales de la plateforme. */
export async function adminStats(
  ctx: AuthzContext
): Promise<Result<{ organizations: number; users: number; activeSubscriptions: number }>> {
  requireSuperAdmin(ctx);
  try {
    const [orgs, users, subs] = await Promise.all([
      db().select({ c: sql<number>`count(*)::int` }).from(organizations),
      db().select({ c: sql<number>`count(*)::int` }).from(profiles),
      db()
        .select({ c: sql<number>`count(*)::int` })
        .from(subscriptions)
        .where(eq(subscriptions.status, "active")),
    ]);
    return ok({
      organizations: Number(orgs[0]?.c ?? 0),
      users: Number(users[0]?.c ?? 0),
      activeSubscriptions: Number(subs[0]?.c ?? 0),
    });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** Suspend une organisation (perte d'accès immédiate). */
export async function suspendOrganization(
  ctx: AuthzContext,
  orgId: string
): Promise<Result<typeof organizations.$inferSelect>> {
  requireSuperAdmin(ctx);
  try {
    const [row] = await db()
      .update(organizations)
      .set({ status: "suspended" })
      .where(eq(organizations.id, orgId))
      .returning();
    if (!row) return err("Organisation introuvable.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: "admin",
      action: "organization.suspend",
      entityType: "organization",
      entityId: orgId,
      newValue: { status: "suspended" },
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de suspension");
  }
}

/** Réactive une organisation. */
export async function reactivateOrganization(
  ctx: AuthzContext,
  orgId: string
): Promise<Result<typeof organizations.$inferSelect>> {
  requireSuperAdmin(ctx);
  try {
    const [row] = await db()
      .update(organizations)
      .set({ status: "active" })
      .where(eq(organizations.id, orgId))
      .returning();
    if (!row) return err("Organisation introuvable.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: "admin",
      action: "organization.reactivate",
      entityType: "organization",
      entityId: orgId,
      newValue: { status: "active" },
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de réactivation");
  }
}

/** Change le forfait d'une organisation (les données sont conservées). */
export async function changeOrganizationPlan(
  ctx: AuthzContext,
  orgId: string,
  plan: string
): Promise<Result<typeof organizations.$inferSelect>> {
  requireSuperAdmin(ctx);
  if (!["free", "standard", "business", "vip"].includes(plan)) {
    return err("Forfait invalide.");
  }
  try {
    const [row] = await db()
      .update(organizations)
      .set({ plan })
      .where(eq(organizations.id, orgId))
      .returning();
    if (!row) return err("Organisation introuvable.");
    await db()
      .update(subscriptions)
      .set({ plan, status: "active", endedAt: null })
      .where(eq(subscriptions.organizationId, orgId));
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: "subscription",
      action: "subscription.change_plan",
      entityType: "organization",
      entityId: orgId,
      newValue: { plan },
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de changement de forfait");
  }
}

/** Valide le paiement et active l'abonnement d'une organisation. */
export async function activateSubscription(
  ctx: AuthzContext,
  orgId: string
): Promise<Result<typeof organizations.$inferSelect>> {
  requireSuperAdmin(ctx);
  try {
    const [row] = await db()
      .update(organizations)
      .set({ status: "active" })
      .where(eq(organizations.id, orgId))
      .returning();
    if (!row) return err("Organisation introuvable.");
    await db()
      .update(subscriptions)
      .set({ status: "active", endedAt: null })
      .where(eq(subscriptions.organizationId, orgId));
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: "subscription",
      action: "subscription.activate",
      entityType: "organization",
      entityId: orgId,
      newValue: { status: "active" },
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur d'activation");
  }
}

/** Réinitialise le mot de passe d'un utilisateur (procédure Super Admin). */
export async function resetUserPassword(
  ctx: AuthzContext,
  userId: string
): Promise<Result<{ temporaryPassword: string }>> {
  requireSuperAdmin(ctx);
  try {
    const temporaryPassword = `Bwr-${Math.random().toString(36).slice(2, 12)}`;
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: temporaryPassword,
    });
    if (error) return err(error.message);
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      module: "admin",
      action: "user.reset_password",
      entityType: "profile",
      entityId: userId,
    });
    return ok({ temporaryPassword });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de réinitialisation");
  }
}

/** Journal d'audit global de la plateforme (Super Admin). */
export async function listGlobalAudit(
  ctx: AuthzContext,
  opts: { limit?: number } = {}
): Promise<Result<typeof auditLogs.$inferSelect[]>> {
  requireSuperAdmin(ctx);
  try {
    const rows = await db()
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(Math.min(200, opts.limit ?? 100));
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** Crée une organisation + compte administrateur + abonnement (Super Admin). */
export async function createOrganizationByAdmin(
  ctx: AuthzContext,
  input: { name: string; email: string; username: string; fullName: string; sector?: string }
): Promise<Result<{ orgId: string; temporaryPassword: string }>> {
  requireSuperAdmin(ctx);
  try {
    const temporaryPassword = `Bwr-${Math.random().toString(36).slice(2, 12)}`;
    const admin = createAdminClient();

    // 1. Compte auth utilisateur
    const { data: created, error: createUserErr } = await admin.auth.admin.createUser({
      email: input.email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { username: input.username, full_name: input.fullName },
    });
    if (createUserErr || !created?.user) return err("Création du compte impossible.");

    // 2. Organisation
    const { data: org, error: orgErr } = await admin
      .from("organizations")
      .insert({ name: input.name, sector: input.sector ?? "general", country: "KM", currency: "KMF", plan: "free", status: "active" })
      .select("id")
      .single();
    if (orgErr || !org) return err("Création de l'organisation impossible.");

    // 3. Profil administrateur
    const { error: profileErr } = await admin
      .from("profiles")
      .upsert({ id: created.user.id, username: input.username, full_name: input.fullName, email: input.email, role: "admin", organization_id: org.id, status: "active" });
    if (profileErr) return err("Création du profil impossible.");

    // 4. Abonnement
    await admin.from("subscriptions").insert({ organization_id: org.id, plan: "free", status: "active" });

    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      module: "admin",
      action: "organization.create",
      entityType: "organization",
      entityId: org.id,
      newValue: { name: input.name },
    });

    return ok({ orgId: org.id, temporaryPassword });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

/** Change le rôle / statut d'un utilisateur (Super Admin). */
export async function updateUserRole(
  ctx: AuthzContext,
  userId: string,
  input: { role?: string; status?: string }
): Promise<Result<typeof profiles.$inferSelect>> {
  requireSuperAdmin(ctx);
  try {
    const set: Record<string, unknown> = {};
    if (input.role) set.role = input.role;
    if (input.status) set.status = input.status;
    const [row] = await db().update(profiles).set(set).where(eq(profiles.id, userId)).returning();
    if (!row) return err("Utilisateur introuvable.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      module: "admin",
      action: "user.update_role",
      entityType: "profile",
      entityId: userId,
      newValue: set,
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de mise à jour");
  }
}
