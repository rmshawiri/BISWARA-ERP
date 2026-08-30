import "server-only";

import { eq, and, or, ilike } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import type { AuthzContext } from "@/types";
import { hasPermission } from "@/server/rbac";
import { logAudit } from "@/engines/audit";
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
