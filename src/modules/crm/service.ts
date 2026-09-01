import "server-only";

import { eq, and, or, ilike } from "drizzle-orm";
import { db } from "@/db";
import { customers, opportunities } from "@/db/schema";
import type { AuthzContext } from "@/types";
import { hasPermission } from "@/server/rbac";
import { logAudit } from "@/engines/audit";
import { dispatchWebhook } from "@/engines/webhook";
import { MODULES, type PermissionAction } from "@/lib/constants";
import { err, ok, Result } from "@/lib/result";
import { CreateCustomerInput, UpdateCustomerInput } from "./validation";

function requirePerm(ctx: AuthzContext, action: PermissionAction): void {
  if (!hasPermission(ctx, MODULES.CRM, action)) {
    throw new Error("Vous n'êtes pas autorisé à effectuer cette action.");
  }
}

/** Liste des clients/prospects de l'organisation (recherche optionnelle). */
export async function listCustomers(
  ctx: AuthzContext,
  opts: { search?: string; type?: string } = {}
): Promise<Result<typeof customers.$inferSelect[]>> {
  requirePerm(ctx, "view");
  const orgId = ctx.organization!.id;
  try {
    const conds = [eq(customers.organizationId, orgId)];
    if (opts.type) conds.push(eq(customers.type, opts.type));
    if (opts.search) {
      const p = `%${opts.search}%`;
      conds.push(
        or(
          ilike(customers.lastname, p),
          ilike(customers.firstname, p),
          ilike(customers.company, p)
        )!
      );
    }
    const result = await db()
      .select()
      .from(customers)
      .where(and(...conds))
      .orderBy(customers.createdAt);
    return ok(result);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

export async function createCustomer(
  ctx: AuthzContext,
  input: CreateCustomerInput
): Promise<Result<typeof customers.$inferSelect>> {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db()
      .insert(customers)
      .values({ ...input, organizationId: orgId })
      .returning();
    if (!row) return err("Création impossible.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.CRM,
      action: "customer.create",
      entityType: "customer",
      entityId: row.id,
      newValue: { name: row.lastname, type: row.type },
    });
    // Webhook best-effort (non bloquant) : "Nouveau client".
    void dispatchWebhook(orgId, "customer.created", {
      id: row.id,
      company: row.company,
      name: row.lastname,
      type: row.type,
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

export async function updateCustomer(
  ctx: AuthzContext,
  id: string,
  input: UpdateCustomerInput
): Promise<Result<typeof customers.$inferSelect>> {
  requirePerm(ctx, "update");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db()
      .update(customers)
      .set(input)
      .where(and(eq(customers.id, id), eq(customers.organizationId, orgId)))
      .returning();
    if (!row) return err("Client introuvable.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.CRM,
      action: "customer.update",
      entityType: "customer",
      entityId: row.id,
      newValue: { name: row.lastname, type: row.type },
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de modification");
  }
}

export async function deactivateCustomer(
  ctx: AuthzContext,
  id: string
): Promise<Result<typeof customers.$inferSelect>> {
  requirePerm(ctx, "delete");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db()
      .update(customers)
      .set({ status: "suspended" })
      .where(and(eq(customers.id, id), eq(customers.organizationId, orgId)))
      .returning();
    if (!row) return err("Client introuvable.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.CRM,
      action: "customer.deactivate",
      entityType: "customer",
      entityId: row.id,
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de suppression");
  }
}

/** Liste les opportunités de l'organisation. */
export async function listOpportunities(
  ctx: AuthzContext
): Promise<Result<typeof opportunities.$inferSelect[]>> {
  requirePerm(ctx, "view");
  const orgId = ctx.organization!.id;
  try {
    const rows = await db()
      .select()
      .from(opportunities)
      .where(eq(opportunities.organizationId, orgId))
      .orderBy(opportunities.createdAt);
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** Crée une opportunité. */
export async function createOpportunity(
  ctx: AuthzContext,
  input: { customerId: string; title: string; value: number; probability?: number; stage?: string; expectedDate?: string | null; notes?: string | null }
): Promise<Result<typeof opportunities.$inferSelect>> {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    // Sécurité multi-tenant : le client référencé doit appartenir à l'organisation.
    const [cust] = await db()
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, input.customerId), eq(customers.organizationId, orgId)))
      .limit(1);
    if (!cust) return err("Client introuvable dans votre organisation.");
    const [row] = await db()
      .insert(opportunities)
      .values({
        organizationId: orgId,
        customerId: input.customerId,
        title: input.title,
        value: input.value,
        probability: input.probability ?? 0,
        stage: input.stage ?? "prospect",
        expectedDate: input.expectedDate ?? null,
        notes: input.notes ?? null,
      })
      .returning();
    if (!row) return err("Création impossible.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.CRM,
      action: "opportunity.create",
      entityType: "opportunity",
      entityId: row.id,
      newValue: { title: row.title, value: row.value },
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

/** Met à jour l'étape / statut d'une opportunité. */
export async function updateOpportunityStage(
  ctx: AuthzContext,
  id: string,
  stage: string,
  status?: string
): Promise<Result<typeof opportunities.$inferSelect>> {
  requirePerm(ctx, "update");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db()
      .update(opportunities)
      .set({ stage, ...(status ? { status } : {}) })
      .where(and(eq(opportunities.id, id), eq(opportunities.organizationId, orgId)))
      .returning();
    if (!row) return err("Opportunité introuvable.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.CRM,
      action: "opportunity.stage",
      entityType: "opportunity",
      entityId: id,
      newValue: { stage, status },
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de mise à jour");
  }
}
