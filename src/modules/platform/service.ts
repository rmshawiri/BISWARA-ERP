import "server-only";

import { eq, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { organizations, profiles, subscriptions } from "@/db/schema";
import type { AuthzContext } from "@/types";
import { err, ok, Result } from "@/lib/result";

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
