import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase pour le navigateur (composants client).
 * Utilise la clé publique/publishable (données filtrées par RLS).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
