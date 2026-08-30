"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { ResolvedSignup } from "@/types/signup";

/**
 * Crée l'organisation et le profil administrateur pour un nouvel inscrit.
 * Exécuté côté serveur avec la clé service_role (l'utilisateur Supabase Auth
 * a déjà été créé par signUp, mais il n'a pas encore de ligne profil).
 */
export async function createOrganization(
  input: ResolvedSignup
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();

  // 1. Création de l'organisation.
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({
      name: input.organizationName,
      sector: input.sector,
      country: "KM",
      currency: "KMF",
      plan: "free",
      status: "active",
    })
    .select("id")
    .single();

  if (orgError || !org) {
    return { ok: false, error: "Impossible de créer l'organisation." };
  }

  // 2. Profil administrateur rattaché à l'organisation.
  const { error: profileError } = await admin
    .from("profiles")
    .upsert({
      id: input.authUserId,
      username: input.username,
      full_name: input.fullName,
      email: input.email,
      role: "admin",
      organization_id: org.id,
      status: "active",
    });

  if (profileError) {
    return { ok: false, error: "Impossible de créer le profil." };
  }

  // 3. Activations par défaut : tous les modules du forfait "free".
  const { data: modules } = await admin
    .from("modules")
    .select("id, default_plan")
    .eq("active", true);

  if (modules && modules.length > 0) {
    const freeModules = modules
      .filter((m) => m.default_plan === "free")
      .map((m) => ({ organization_id: org.id, module_id: m.id, active: true }));
    if (freeModules.length > 0) {
      await admin.from("organization_modules").insert(freeModules);
    }
  }

  // 4. Abonnement de démarrage.
  await admin.from("subscriptions").insert({
    organization_id: org.id,
    plan: "free",
    status: "active",
  });

  return { ok: true };
}
