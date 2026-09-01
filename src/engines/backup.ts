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

/**
 * Importe une sauvegarde JSON (générée par `exportOrgData`) dans l'organisation.
 *
 * Restaure les tables métier reconnues en forçant `organization_id` sur
 * l'organisation courante, de sorte qu'une sauvegarde puisse être restaurée
 * dans la même organisation (idempotent, via upsert) ou dans une autre.
 *
 * ⚠️ SÉCURITÉ :
 * - N'accepte que les tables de `BUSINESS_TABLES` (jamais organisations/profiles
 *   ni tables système).
 * - N'exécute que des `upsert` par table ; une erreur sur une table est
 *   journalisée et n'interrompt pas les autres.
 * - Toute restauration est enregistrée dans le Journal d'Audit.
 */
export async function importOrgData(
  ctx: AuthzContext,
  json: string
): Promise<Result<{ restored: number }>> {
  try {
    if (!ctx.organization) return err("Organisation introuvable.");
    const orgId = ctx.organization.id;

    let parsed: { app?: string; exportedAt?: string; data?: Record<string, unknown[]> };
    try {
      parsed = JSON.parse(json);
    } catch {
      return err("Fichier de sauvegarde invalide (JSON illisible).");
    }
    if (parsed?.app !== "biswara-erp" || !parsed.data) {
      return err("Ce fichier n'est pas une sauvegarde BISWARA valide.");
    }

    const admin = createAdminClient();
    let restored = 0;
    for (const [table, rawRows] of Object.entries(parsed.data)) {
      if (!Array.isArray(rawRows) || rawRows.length === 0) continue;
      if (!BUSINESS_TABLES.includes(table)) continue; // whitelist stricte
      // Force l'appartenance à l'organisation cible.
      const payload = rawRows
        .filter((r) => r && typeof r === "object")
        .map((r) => ({ ...(r as Record<string, unknown>), organization_id: orgId }));
      if (payload.length === 0) continue;
      const { error } = await admin.from(table).upsert(payload);
      if (error) {
        console.error(`[BackupEngine] Import ${table} :`, error.message);
        continue;
      }
      restored += payload.length;
    }

    await logAudit({
      userId: ctx.user.id,
      userName: ctx.user.fullName,
      organizationId: orgId,
      module: "backup",
      action: "backup.import",
      entityType: "organization",
      entityId: orgId,
      newValue: { restored },
    });

    return ok({ restored });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erreur d'import");
  }
}
