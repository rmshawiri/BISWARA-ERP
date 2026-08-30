"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { isEmail } from "@/lib/validation";

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

  if (isEmail(value)) return { email: value };

  // Nom d'utilisateur : résolution via la table profiles.
  const admin = createAdminClient();
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
