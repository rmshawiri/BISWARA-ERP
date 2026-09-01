import "server-only";

import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { products, productCategories, units, taxes, brands } from "@/db/schema";
import type { AuthzContext } from "@/types";
import { hasPermission } from "@/server/rbac";
import { logAudit } from "@/engines/audit";
import { dispatchWebhook } from "@/engines/webhook";
import type { PermissionAction } from "@/lib/constants";
import { MODULES } from "@/lib/constants";
import { err, ok, Result } from "@/lib/result";
import {
  CreateCategoryInput,
  CreateProductInput,
  UpdateProductInput,
} from "./validation";

function requirePerm(ctx: AuthzContext, action: PermissionAction): void {
  if (!hasPermission(ctx, MODULES.CATALOG, action)) {
    throw new Error("Vous n'êtes pas autorisé à effectuer cette action.");
  }
}

/** Liste paginée des produits de l'organisation. */
export async function listProducts(
  ctx: AuthzContext,
  opts: { page?: number; pageSize?: number; search?: string } = {}
): Promise<Result<typeof products.$inferSelect[]>> {
  requirePerm(ctx, "view");
  const orgId = ctx.organization!.id;
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, opts.pageSize ?? 25);
  const offset = (page - 1) * pageSize;

  try {
    const result = await db()
      .select()
      .from(products)
      .where(
        and(
          eq(products.organizationId, orgId),
          opts.search ? eq(products.reference, opts.search) : undefined
        )
      )
      .limit(pageSize)
      .offset(offset);
    return ok(result);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** Crée un produit (avec journalisation). */
export async function createProduct(
  ctx: AuthzContext,
  input: CreateProductInput
): Promise<Result<typeof products.$inferSelect>> {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db()
      .insert(products)
      .values({
        ...input,
        organizationId: orgId,
      })
      .returning();
    if (!row) return err("Création impossible.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.CATALOG,
      action: "product.create",
      entityType: "product",
      entityId: row.id,
      newValue: { name: row.name, reference: row.reference },
    });
    // Webhook best-effort (non bloquant) : "Nouveau produit".
    void dispatchWebhook(orgId, "product.created", {
      id: row.id,
      name: row.name,
      reference: row.reference,
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

/** Modifie un produit (organisation forcée — isolation multi-tenant). */
export async function updateProduct(
  ctx: AuthzContext,
  id: string,
  input: UpdateProductInput
): Promise<Result<typeof products.$inferSelect>> {
  requirePerm(ctx, "update");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db()
      .update(products)
      .set(input)
      .where(and(eq(products.id, id), eq(products.organizationId, orgId)))
      .returning();
    if (!row) return err("Produit introuvable.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.CATALOG,
      action: "product.update",
      entityType: "product",
      entityId: row.id,
      newValue: { name: row.name, reference: row.reference },
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de modification");
  }
}

/** Suppression logique (désactivation) d'un produit. */
export async function deactivateProduct(
  ctx: AuthzContext,
  id: string
): Promise<Result<typeof products.$inferSelect>> {
  requirePerm(ctx, "delete");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db()
      .update(products)
      .set({ active: false })
      .where(and(eq(products.id, id), eq(products.organizationId, orgId)))
      .returning();
    if (!row) return err("Produit introuvable.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.CATALOG,
      action: "product.deactivate",
      entityType: "product",
      entityId: row.id,
      oldValue: { active: true },
      newValue: { active: false },
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de suppression");
  }
}

/** Liste des catégories de l'organisation. */
export async function listCategories(
  ctx: AuthzContext
): Promise<Result<typeof productCategories.$inferSelect[]>> {
  requirePerm(ctx, "view");
  const orgId = ctx.organization!.id;
  try {
    const result = await db()
      .select()
      .from(productCategories)
      .where(eq(productCategories.organizationId, orgId));
    return ok(result);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

/** Crée une catégorie. */
export async function createCategory(
  ctx: AuthzContext,
  input: CreateCategoryInput
): Promise<Result<typeof productCategories.$inferSelect>> {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db()
      .insert(productCategories)
      .values({ ...input, organizationId: orgId })
      .returning();
    if (!row) return err("Création impossible.");
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: MODULES.CATALOG,
      action: "category.create",
      entityType: "category",
      entityId: row.id,
      newValue: { name: row.name },
    });
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

/* ---- Référentiels : unités, taxes, marques (tables orphelines câblées) ---- */

export async function listUnits(ctx: AuthzContext) {
  requirePerm(ctx, "view");
  const orgId = ctx.organization!.id;
  try {
    const rows = await db().select().from(units).where(eq(units.organizationId, orgId));
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

export async function createUnit(ctx: AuthzContext, name: string, symbol?: string) {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db().insert(units).values({ organizationId: orgId, name, symbol: symbol ?? null }).returning();
    if (!row) return err("Création impossible.");
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

export async function listTaxes(ctx: AuthzContext) {
  requirePerm(ctx, "view");
  const orgId = ctx.organization!.id;
  try {
    const rows = await db().select().from(taxes).where(eq(taxes.organizationId, orgId));
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

export async function createTax(ctx: AuthzContext, name: string, rate: number) {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db().insert(taxes).values({ organizationId: orgId, name, rate }).returning();
    if (!row) return err("Création impossible.");
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}

export async function listBrands(ctx: AuthzContext) {
  requirePerm(ctx, "view");
  const orgId = ctx.organization!.id;
  try {
    const rows = await db().select().from(brands).where(eq(brands.organizationId, orgId));
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de lecture");
  }
}

export async function createBrand(ctx: AuthzContext, name: string) {
  requirePerm(ctx, "create");
  const orgId = ctx.organization!.id;
  try {
    const [row] = await db().insert(brands).values({ organizationId: orgId, name }).returning();
    if (!row) return err("Création impossible.");
    return ok(row);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de création");
  }
}
