import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback d'authentification Supabase (confirmation d'e-mail / OAuth).
 *
 * BISWARA n'avait AUCUN handler : le lien de confirmation envoyé par e-mail
 * pointait vers `SITE_URL/?code=<token>` et le code n'était jamais échangé,
 * d'où la page d'erreur (CAP 01). Cette route :
 *  1. lit le paramètre `code` ;
 *  2. échange le code contre une session (`exchangeCodeForSession`) ;
 *  3. redirige automatiquement selon le profil (Super Admin → /admin,
 *     utilisateur d'organisation → /app), conformément à la documentation.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Détermine la destination selon le rôle (même logique que login/page.tsx).
      let destination = "/app";
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          if (profile?.role === "super_admin") destination = "/admin";
        }
      } catch {
        // Défaut : tableau de bord.
      }
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  // Échec ou code absent : retour à la connexion.
  return NextResponse.redirect(`${origin}/login`);
}
