import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type AuditLevel = "info" | "warning" | "critical";

export interface AuditEntryInput {
  userId?: string | null;
  userName?: string | null;
  organizationId?: string | null;
  module: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  ip?: string | null;
  level?: AuditLevel;
}

/**
 * AUDIT ENGINE — journalise une action importante.
 * Toutes les opérations sensibles doivent passer par ce moteur.
 * L'insertion se fait avec la clé service_role (les journaux sont immuables
 * côté applicatif : aucun utilisateur ne peut écrire/modifier via RLS).
 */
export async function logAudit(entry: AuditEntryInput): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("audit_logs").insert({
    user_id: entry.userId ?? null,
    user_name: entry.userName ?? null,
    organization_id: entry.organizationId ?? null,
    module: entry.module,
    action: entry.action,
    entity_type: entry.entityType ?? null,
    entity_id: entry.entityId ?? null,
    old_value: entry.oldValue ?? null,
    new_value: entry.newValue ?? null,
    ip: entry.ip ?? null,
    level: entry.level ?? "info",
  });
  if (error) {
    // Ne bloque pas l'action métier ; on log le problème.
    console.error("[AuditEngine] Échec de journalisation:", error.message);
  }
}
