import "server-only";

import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { currencies, paymentMethods, apiKeys, webhooks } from "@/db/schema";
import type { AuthzContext } from "@/types";
import { hasPermission } from "@/server/rbac";
import { logAudit } from "@/engines/audit";
import { MODULES } from "@/lib/constants";
import { err, ok, Result } from "@/lib/result";

function requireOrg(ctx: AuthzContext) {
  if (!ctx.organization) throw new Error("Organisation introuvable.");
  return ctx.organization.id;
}
function requireAdmin(ctx: AuthzContext) {
  if (!hasPermission(ctx, MODULES.ADMIN, "configure") && !hasPermission(ctx, MODULES.SETTINGS, "update")) {
    throw new Error("Accès réservé à l'administration.");
  }
  return requireOrg(ctx);
}

/* ---- Devises ---- */
export async function listCurrencies(ctx: AuthzContext) {
  try {
    const rows = await db().select().from(currencies).where(eq(currencies.organizationId, requireAdmin(ctx)));
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}
export async function addCurrency(ctx: AuthzContext, code: string, name: string, rateToKmf: number) {
  try {
    const orgId = requireAdmin(ctx);
    const count = await db().select({ id: currencies.id }).from(currencies).where(eq(currencies.organizationId, orgId));
    const [row] = await db().insert(currencies).values({ organizationId: orgId, code, name, rateToKmf, isDefault: count.length === 0 }).returning();
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}
export async function setDefaultCurrency(ctx: AuthzContext, id: string) {
  try {
    const orgId = requireAdmin(ctx);
    await db().update(currencies).set({ isDefault: false }).where(eq(currencies.organizationId, orgId));
    const [row] = await db().update(currencies).set({ isDefault: true }).where(and(eq(currencies.id, id), eq(currencies.organizationId, orgId))).returning();
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de mise à jour");
  }
}

/* ---- Modes de paiement ---- */
export async function listPaymentMethods(ctx: AuthzContext) {
  try {
    const rows = await db().select().from(paymentMethods).where(eq(paymentMethods.organizationId, requireAdmin(ctx)));
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}
export async function addPaymentMethod(ctx: AuthzContext, name: string, code: string) {
  try {
    const orgId = requireAdmin(ctx);
    const [row] = await db().insert(paymentMethods).values({ organizationId: orgId, name, code }).returning();
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}
export async function togglePaymentMethod(ctx: AuthzContext, id: string, active: boolean) {
  try {
    const orgId = requireAdmin(ctx);
    const [row] = await db().update(paymentMethods).set({ active }).where(and(eq(paymentMethods.id, id), eq(paymentMethods.organizationId, orgId))).returning();
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de mise à jour");
  }
}

/* ---- Clés API ---- */
export async function listApiKeys(ctx: AuthzContext) {
  try {
    const rows = await db().select().from(apiKeys).where(eq(apiKeys.organizationId, requireAdmin(ctx)));
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}
export async function createApiKey(ctx: AuthzContext, label: string) {
  try {
    requireAdmin(ctx);
    const orgId = requireOrg(ctx);
    const keyText = `bwr_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
    const [row] = await db().insert(apiKeys).values({ organizationId: orgId, keyText, label }).returning();
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}
export async function revokeApiKey(ctx: AuthzContext, id: string) {
  try {
    const orgId = requireAdmin(ctx);
    await db().update(apiKeys).set({ active: false }).where(and(eq(apiKeys.id, id), eq(apiKeys.organizationId, orgId)));
    return ok(true);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de révocation");
  }
}

/* ---- Webhooks ---- */
export async function listWebhooks(ctx: AuthzContext) {
  try {
    const rows = await db().select().from(webhooks).where(eq(webhooks.organizationId, requireAdmin(ctx)));
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}
export async function addWebhook(ctx: AuthzContext, event: string, url: string) {
  try {
    requireAdmin(ctx);
    const orgId = requireOrg(ctx);
    const [row] = await db().insert(webhooks).values({ organizationId: orgId, event: event || "all", url }).returning();
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}
export async function removeWebhook(ctx: AuthzContext, id: string) {
  try {
    const orgId = requireAdmin(ctx);
    await db().delete(webhooks).where(and(eq(webhooks.id, id), eq(webhooks.organizationId, orgId)));
    return ok(true);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de suppression");
  }
}
