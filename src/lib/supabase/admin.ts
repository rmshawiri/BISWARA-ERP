import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase avec la clé SECRET (service_role).
 *
 * ⚠️ RÉSERVÉ AU SERVEUR UNIQUEMENT.
 * - Ne jamais l'utiliser dans du code côté client.
 * - Contourne RLS : les filtres d'organisation DOIVENT être injectés
 *   manuellement via `requireOrg()` pour garantir l'isolation multi-tenant.
 *
 * Usage : jobs d'administration, imports/exports, seed, tâches de fond.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!serviceRole) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY manquante");
  }
  return createSupabaseClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
