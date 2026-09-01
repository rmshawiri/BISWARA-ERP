"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { ResolvedSignup } from "@/types/signup";
import { seedDemoData } from "@/modules/demo/seed";

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
  //   Robustesse : si le catalogue n'est pas encore seedé dans la base,
  //   on le crée à la volée pour garantir qu'une nouvelle organisation
  //   reçoive bien ses modules de base par défaut.
  const DEFAULT_FREE_MODULES: { id: string; name: string; default_plan: string }[] = [
    { id: "admin", name: "Administration", default_plan: "free" },
    { id: "settings", name: "Paramètres", default_plan: "free" },
    { id: "notifications", name: "Centre de Notifications", default_plan: "free" },
    { id: "crm", name: "CRM", default_plan: "free" },
    { id: "catalog", name: "Catalogue Produits & Services", default_plan: "free" },
    { id: "sales", name: "Gestion Commerciale", default_plan: "free" },
    { id: "stock", name: "Stock & Inventaire", default_plan: "free" },
  ];

  let freeModules: { module_id: string; active: boolean; organization_id: string }[] = [];
  const { data: modules } = await admin
    .from("modules")
    .select("id, default_plan")
    .eq("active", true);

  if (modules && modules.length > 0) {
    freeModules = modules
      .filter((m) => m.default_plan === "free")
      .map((m) => ({ organization_id: org.id, module_id: m.id, active: true }));
  }

  if (freeModules.length === 0) {
    // Le catalogue est vide : on l'initialise avec le socle "free".
    await admin.from("modules").upsert(DEFAULT_FREE_MODULES);
    freeModules = DEFAULT_FREE_MODULES.map((m) => ({
      organization_id: org.id,
      module_id: m.id,
      active: true,
    }));
  }

  if (freeModules.length > 0) {
    await admin.from("organization_modules").insert(freeModules);
  }

  // 4. Abonnement de démarrage.
  await admin.from("subscriptions").insert({
    organization_id: org.id,
    plan: "free",
    status: "active",
  });

  // 5. Données de démonstration (best-effort, non bloquant).
  try {
    await seedDemoData(org.id);
  } catch {
    // Ne bloque pas la création.
  }

  return { ok: true };
}
