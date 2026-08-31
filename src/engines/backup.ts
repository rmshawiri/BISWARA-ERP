import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { AuthzContext } from "@/types";
import { err, ok, Result } from "@/lib/result";
import { logAudit } from "@/engines/audit";

// Tables métier rattachées à une organisation (export / reset).
const BUSINESS_TABLES = [
  "products",
  "product_categories",
  "customers",
  "opportunities",
  "sales_documents",
  "sales_document_lines",
  "payments",
  "warehouses",
  "stock_movements",
  "inventory_counts",
  "suppliers",
  "purchase_documents",
  "purchase_document_lines",
  "accounts",
  "cash_sessions",
  "financial_transactions",
  "budgets",
  "chart_of_accounts",
  "journals",
  "journal_entries",
  "journal_entry_lines",
  "fiscal_years",
  "assets",
  "employees",
  "leave_requests",
  "projects",
  "project_tasks",
  "vehicles",
  "deliveries",
];

/**
 * Backup Engine — exporte les données métier de l'organisation en JSON.
 * Lecture via la clé service_role (serveur uniquement).
 */
export async function exportOrgData(
  ctx: AuthzContext
): Promise<Result<{ filename: string; json: string }>> {
  try {
    if (!ctx.organization) return err("Organisation introuvable.");
    const orgId = ctx.organization.id;
    const admin = createAdminClient();
    const data: Record<string, unknown> = {};
    for (const table of BUSINESS_TABLES) {
      const { data: rows, error } = await admin
        .from(table)
        .select("*")
        .eq("organization_id", orgId);
      if (!error) data[table] = rows;
    }
    const json = JSON.stringify(
      { app: "biswara-erp", exportedAt: new Date().toISOString(), organizationId: orgId, data },
      null,
      2
    );
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: "backup",
      action: "backup.export",
      entityType: "organization",
      entityId: orgId,
    });
    const filename = `biswara-backup-${orgId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`;
    return ok({ filename, json });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur d'export");
  }
}

/**
 * Réinitialise complètement les données métier de l'organisation
 * (conserve organisation, utilisateurs et paramètres). Irréversible.
 */
export async function resetOrgData(ctx: AuthzContext): Promise<Result<boolean>> {
  try {
    if (!ctx.organization) return err("Organisation introuvable.");
    const orgId = ctx.organization.id;
    const admin = createAdminClient();
    for (const table of BUSINESS_TABLES) {
      const { error } = await admin.from(table).delete().eq("organization_id", orgId);
      if (error) {
        // Ignore certaines tables (attendu si la table n'existe pas encore).
        continue;
      }
    }
    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: "backup",
      action: "backup.reset",
      entityType: "organization",
      entityId: orgId,
      level: "critical",
    });
    return ok(true);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur de réinitialisation");
  }
}
