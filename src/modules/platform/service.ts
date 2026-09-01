import "server-only";

import { eq, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { organizations, profiles, subscriptions, auditLogs } from "@/db/schema";
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

export interface AdminSubscription {
  id: string;
  organizationId: string | null;
  plan: string;
  status: string;
  orgName: string | null;
  startedAt: Date;
  endedAt: Date | null;
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
