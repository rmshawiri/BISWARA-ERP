/**
 * BISWARA ERP — Seed initial (idempotent).
 *
 * Exécution :
 *   node --env-file=.env.local supabase/seed/seed.mjs
 *
 * Utilise la clé SERVICE ROLE (serveur uniquement). Ne JAMAIS exposer.
 * Crée :
 *  - le compte Super Admin (username: rachade)
 *  - le catalogue des 16 modules de base
 *  - le catalogue des activités métier (enregistrées comme configurables)
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  throw new Error("Variables d'environnement Supabase manquantes.");
}

const admin = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SUPER_ADMIN = {
  email: process.env.SUPER_ADMIN_EMAIL || "admin@biswara.app",
  password: process.env.SUPER_ADMIN_PASSWORD || "Rachoums2026",
  username: process.env.SUPER_ADMIN_USERNAME || "rachade",
  fullName: "MORA Shawiri (Super Admin)",
};

const MODULES = [
  ["admin", "Administration", "Gestion des collaborateurs, rôles, permissions, sessions et audit.", "base", "free", 1],
  ["settings", "Paramètres", "Configuration de l'organisation (identité, préférences, modules, activités).", "base", "free", 2],
  ["notifications", "Centre de Notifications", "Centralisation des notifications de toute la plateforme.", "base", "free", 3],
  ["crm", "CRM", "Gestion de la relation client (prospects, clients, pipeline).", "base", "standard", 4],
  ["sales", "Gestion Commerciale", "Devis, commandes, bons de livraison, factures, paiements, créances.", "base", "standard", 5],
  ["catalog", "Catalogue Produits & Services", "Produits, services, catégories, tarifs, variantes, taxes.", "base", "standard", 6],
  ["stock", "Stock & Inventaire", "Dépôts, mouvements, inventaires, ajustements, alertes.", "base", "standard", 7],
  ["purchases", "Achats & Fournisseurs", "Fournisseurs, demandes d'achat, bons de commande, réceptions, validations.", "base", "business", 8],
  ["finance", "Finance & Trésorerie", "Caisses, banques, paiements, budgets, trésorerie, rapprochements.", "base", "business", 9],
  ["accounting", "Comptabilité", "Plan comptable, écritures, journaux, états financiers, clôtures.", "base", "business", 10],
  ["assets", "Immobilisations & Actifs", "Actifs, affectations, amortissements, maintenances, inventaires.", "base", "business", 11],
  ["employee_portal", "Portail Employé", "Espace personnel sécurisé du collaborateur.", "base", "standard", 12],
  ["hr", "Ressources Humaines", "Employés, contrats, congés, présences, paie, formations.", "base", "business", 13],
  ["logistics", "Logistique & Transport", "Véhicules, chauffeurs, livraisons, tournées, carburant.", "base", "business", 14],
  ["projects", "Gestion de Projets", "Projets, tâches, Kanban, calendrier, temps, équipes.", "base", "business", 15],
  ["activities", "Gestion des Activités", "Installation, activation, configuration des activités métier.", "base", "free", 16],
];

const ACTIVITIES = [
  ["commerce", "Commerce & Boutique", "Gestion de boutique, ventes, stock, caisse.", "commerce", "standard"],
  ["restaurant", "Restaurant", "Tables, menus, commandes, cuisine, livraison.", "restauration", "business"],
  ["hotel", "Hôtel", "Chambres, réservations, séjours, ménage.", "restauration", "business"],
  ["dentiste", "Cabinet Dentaire", "Patients, rendez-vous, soins, dossiers.", "sante", "business"],
  ["medical", "Cabinet Médical", "Patients, consultations, rendez-vous.", "sante", "business"],
  ["pharmacie", "Pharmacie", "Médicaments, ventes, ordonnances, stock.", "sante", "business"],
  ["voyage", "Agence de Voyage", "Voyages, réservations, billets.", "transport", "business"],
  ["transport", "Transport", "Flotte, chauffeurs, courses, maintenance.", "transport", "business"],
  ["agriculture", "Agriculture", "Exploitation, récoltes, production.", "agriculture", "business"],
  ["peche", "Pêche", "Pêche, capture, transformation.", "agriculture", "business"],
  ["btp", "BTP", "Chantiers, devis, matériaux, équipes.", "btp", "business"],
  ["immobilier", "Immobilier", "Biens, locations, ventes, mandats.", "btp", "business"],
  ["ecole", "École", "Élèves, cours, notes, enseignants.", "education", "business"],
  ["formation", "Centre de Formation", "Formations, stagiaires, certificats.", "education", "standard"],
  ["ong", "ONG & Association", "Membres, projets, dons, bénéficiaires.", "organisations", "standard"],
  ["coiffure", "Salon de Coiffure", "Rendez-vous, clients, services.", "beaute", "standard"],
  ["cooperative", "Coopérative", "Membres, cotisations, activités.", "organisations", "standard"],
];

async function main() {
  console.log("🌱 Démarrage du seed BISWARA...");

  // 1. Super Admin — résolution robuste : chercher par email, créer si absent.
  const { users: existingUsers } = (await admin.auth.admin.listUsers({ perPage: 1000 }))?.data ?? {};
  let authUser = (existingUsers ?? []).find((u) => u.email === SUPER_ADMIN.email) ?? null;

  if (!authUser) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: SUPER_ADMIN.email,
      password: SUPER_ADMIN.password,
      email_confirm: true,
      user_metadata: { username: SUPER_ADMIN.username, full_name: SUPER_ADMIN.fullName },
    });
    if (createError) {
      throw new Error(`Création Super Admin échouée: ${createError.message}`);
    }
    authUser = created?.user ?? null;
  }

  if (!authUser?.id) throw new Error("Impossible de résoudre le compte Super Admin.");

  const { error: profileError } = await admin
    .from("profiles")
    .upsert(
      {
        id: authUser.id,
        username: SUPER_ADMIN.username,
        full_name: SUPER_ADMIN.fullName,
        email: SUPER_ADMIN.email,
        role: "super_admin",
        organization_id: null,
        status: "active",
      },
      { onConflict: "id" }
    );
  if (profileError) throw new Error(`Upsert Super Admin profil: ${profileError.message}`);
  console.log(`✅ Super Admin prêt (${SUPER_ADMIN.username})`);

  // 2. Modules
  for (const [id, name, description, category, default_plan, sort] of MODULES) {
    const { error } = await admin.from("modules").upsert(
      { id, name, description, category, default_plan, sort_order: sort, active: true },
      { onConflict: "id" }
    );
    if (error) throw new Error(`Modules upsert ${id}: ${error.message}`);
  }
  console.log(`✅ ${MODULES.length} modules de base enregistrés`);

  // 3. Activités
  for (const [id, name, description, category, default_plan] of ACTIVITIES) {
    const { error } = await admin.from("activities").upsert(
      { id, name, description, category, default_plan, active: true },
      { onConflict: "id" }
    );
    if (error) throw new Error(`Activités upsert ${id}: ${error.message}`);
  }
  console.log(`✅ ${ACTIVITIES.length} activités enregistrées`);

  console.log("🎉 Seed terminé.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
