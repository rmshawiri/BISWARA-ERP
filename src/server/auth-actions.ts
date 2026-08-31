"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { isEmail } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Résout un identifiant de connexion (email ou nom d'utilisateur) vers l'email
 * du compte Supabase. Utilisé pour permettre au Super Admin de se connecter
 * avec son nom d'utilisateur (ex : "rachade").
 */
export async function resolveIdentifier(identifier: string): Promise<{
  email?: string;
  error?: string;
}> {
  const value = identifier.trim();
  if (!value) return { error: "Veuillez saisir un identifiant." };

  // Anti-bruteforce basique (baseline).
  const rl = checkRateLimit(`login:${value.toLowerCase()}`, 10, 5 * 60 * 1000);
  if (!rl.allowed) {
    return { error: "Trop de tentatives. Réessayez dans quelques minutes." };
  }

  if (isEmail(value)) return { email: value };

  // Nom d'utilisateur : résolution via la table profiles.
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      error:
        "Service d'authentification indisponible. Vérifiez la configuration des variables d'environnement.",
    };
  }
  const { data, error } = await admin
    .from("profiles")
    .select("email")
    .eq("username", value)
    .maybeSingle();

  if (error) return { error: "Identifiant introuvable." };
  if (!data?.email) {
    return { error: "Aucun compte ne correspond à cet identifiant." };
  }
  return { email: data.email };
}
