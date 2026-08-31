import "server-only";

import { ilike, or, eq, and } from "drizzle-orm";
import { db } from "@/db";
import {
  customers,
  products,
  salesDocuments,
  warehouses,
  suppliers,
  employees,
  projects,
  vehicles,
  assets,
} from "@/db/schema";
import type { AuthzContext } from "@/types";
import { hasPermission } from "@/server/rbac";
import { MODULES, type PermissionAction } from "@/lib/constants";
import { ok, Result } from "@/lib/result";

export interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

export interface GlobalSearchOutput {
  query: string;
  results: SearchResult[];
}

function can(ctx: AuthzContext, module: string, action: PermissionAction) {
  return hasPermission(ctx, module, action);
}

/**
 * SEARCH ENGINE — recherche globale multi-modules.
 * Respecte les permissions et l'isolation multi-tenant (organization_id),
 * et retourne des résultats groupés par type.
 */
export async function globalSearch(
  ctx: AuthzContext,
  rawQuery: string
): Promise<Result<GlobalSearchOutput>> {
  const q = rawQuery.trim();
  if (!q) return ok({ query: q, results: [] });

  const orgId = ctx.organization?.id;
  const results: SearchResult[] = [];
  const pattern = `%${q}%`;

  try {
    // Produits (module catalog)
    if (orgId && can(ctx, MODULES.CATALOG, "view")) {
      const rows = await db()
        .select({ id: products.id, name: products.name, reference: products.reference })
        .from(products)
        .where(
          and(
            eq(products.organizationId, orgId),
            or(ilike(products.name, pattern), ilike(products.reference, pattern))
          )
        )
        .limit(10);
      for (const r of rows) {
        results.push({
          type: "Produit",
          id: r.id,
          title: r.name,
          subtitle: r.reference,
          href: `/app/catalogue?id=${r.id}`,
        });
      }
    }

    // Clients / prospects (module CRM)
    if (orgId && can(ctx, MODULES.CRM, "view")) {
      const rows = await db()
        .select({ id: customers.id, lastname: customers.lastname, company: customers.company, email: customers.email })
        .from(customers)
        .where(
          and(
            eq(customers.organizationId, orgId),
            or(
              ilike(customers.lastname, pattern),
              ilike(customers.company, pattern),
              ilike(customers.email, pattern)
            )
          )
        )
        .limit(10);
      for (const r of rows) {
        results.push({
          type: "Client",
          id: r.id,
          title: r.company ? `${r.company} — ${r.lastname}` : r.lastname,
          subtitle: r.email ?? undefined,
          href: `/app/crm?id=${r.id}`,
        });
      }
    }

    // Documents commerciaux (module sales)
    if (orgId && can(ctx, MODULES.SALES, "view")) {
      const rows = await db()
        .select({ id: salesDocuments.id, number: salesDocuments.number, type: salesDocuments.type })
        .from(salesDocuments)
        .where(and(eq(salesDocuments.organizationId, orgId), ilike(salesDocuments.number, pattern)))
        .limit(10);
      for (const r of rows) {
        results.push({
          type: "Document",
          id: r.id,
          title: r.number,
          subtitle: r.type,
          href: `/app/ventes?id=${r.id}`,
        });
      }
    }

    // Dépôts (module stock)
    if (orgId && can(ctx, MODULES.STOCK, "view")) {
      const rows = await db()
        .select({ id: warehouses.id, name: warehouses.name, code: warehouses.code })
        .from(warehouses)
        .where(
          and(
            eq(warehouses.organizationId, orgId),
            or(ilike(warehouses.name, pattern), ilike(warehouses.code, pattern))
          )
        )
        .limit(10);
      for (const r of rows) {
        results.push({
          type: "Dépôt",
          id: r.id,
          title: r.name,
          subtitle: r.code ?? undefined,
          href: `/app/stock?id=${r.id}`,
        });
      }
    }

    // Fournisseurs (module achats)
    if (orgId && can(ctx, MODULES.PURCHASES, "view")) {
      const rows = await db()
        .select({ id: suppliers.id, name: suppliers.name, contact: suppliers.contact, email: suppliers.email })
        .from(suppliers)
        .where(
          and(
            eq(suppliers.organizationId, orgId),
            or(ilike(suppliers.name, pattern), ilike(suppliers.email, pattern))
          )
        )
        .limit(10);
      for (const r of rows) {
        results.push({
          type: "Fournisseur",
          id: r.id,
          title: r.name,
          subtitle: r.email ?? r.contact ?? undefined,
          href: `/app/achats?id=${r.id}`,
        });
      }
    }

    // Employés (module RH)
    if (orgId && can(ctx, MODULES.HR, "view")) {
      const rows = await db()
        .select({ id: employees.id, first: employees.firstName, last: employees.lastName, position: employees.position })
        .from(employees)
        .where(
          and(
            eq(employees.organizationId, orgId),
            or(ilike(employees.firstName, pattern), ilike(employees.lastName, pattern))
          )
        )
        .limit(10);
      for (const r of rows) {
        results.push({
          type: "Employé",
          id: r.id,
          title: `${r.first} ${r.last}`,
          subtitle: r.position ?? undefined,
          href: `/app/rh?id=${r.id}`,
        });
      }
    }

    // Projets (module projets)
    if (orgId && can(ctx, MODULES.PROJECTS, "view")) {
      const rows = await db()
        .select({ id: projects.id, name: projects.name, description: projects.description })
        .from(projects)
        .where(and(eq(projects.organizationId, orgId), ilike(projects.name, pattern)))
        .limit(10);
      for (const r of rows) {
        results.push({
          type: "Projet",
          id: r.id,
          title: r.name,
          subtitle: r.description ?? undefined,
          href: `/app/projets?id=${r.id}`,
        });
      }
    }

    // Véhicules (module logistique)
    if (orgId && can(ctx, MODULES.LOGISTICS, "view")) {
      const rows = await db()
        .select({ id: vehicles.id, plate: vehicles.plate, model: vehicles.model })
        .from(vehicles)
        .where(and(eq(vehicles.organizationId, orgId), ilike(vehicles.plate, pattern)))
        .limit(10);
      for (const r of rows) {
        results.push({
          type: "Véhicule",
          id: r.id,
          title: r.plate,
          subtitle: r.model ?? undefined,
          href: `/app/logistique?id=${r.id}`,
        });
      }
    }

    // Immobilisations (module actifs)
    if (orgId && can(ctx, MODULES.ASSETS, "view")) {
      const rows = await db()
        .select({ id: assets.id, name: assets.name, reference: assets.reference })
        .from(assets)
        .where(and(eq(assets.organizationId, orgId), ilike(assets.name, pattern)))
        .limit(10);
      for (const r of rows) {
        results.push({
          type: "Immobilisation",
          id: r.id,
          title: r.name,
          subtitle: r.reference ?? undefined,
          href: `/app/immobilisations?id=${r.id}`,
        });
      }
    }

    return ok({ query: q, results });
  } catch {
    return ok({ query: q, results });
  }
}
