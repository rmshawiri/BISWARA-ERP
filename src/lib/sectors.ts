/**
 * Liste canonique des secteurs / activités métier BISWARA.
 *
 * Alignée sur le catalogue d'activités seedé en base (`supabase/seed/seed.mjs`)
 * et sur la documentation (MODULE 16 GESTION DES ACTIVITÉS). La valeur stockée
 * sur `organizations.sector` correspond à l'identifiant d'activité (ex: "commerce"),
 * cohérent avec les données existantes (le smoke-test insère "commerce", "restaurant").
 *
 * Remarque architecture : l'ajout d'une activité par un utilisateur final n'est pas
 * prévu par la documentation (le catalogue d'activités est géré au niveau plateforme /
 * Super Admin). L'option « Autre » ci-dessous permet néanmoins de saisir un secteur
 * libre qui sera enregistré sur l'organisation ; son ajout au catalogue global reste
 * une décision produit (à traiter au niveau Admin de plateforme).
 */
export const SECTORS: { id: string; label: string }[] = [
  { id: "commerce", label: "Commerce & Boutique" },
  { id: "restaurant", label: "Restaurant" },
  { id: "hotel", label: "Hôtel" },
  { id: "dentiste", label: "Cabinet Dentaire" },
  { id: "medical", label: "Cabinet Médical" },
  { id: "pharmacie", label: "Pharmacie" },
  { id: "voyage", label: "Agence de Voyage" },
  { id: "transport", label: "Transport" },
  { id: "agriculture", label: "Agriculture" },
  { id: "peche", label: "Pêche" },
  { id: "btp", label: "BTP" },
  { id: "immobilier", label: "Immobilier" },
  { id: "ecole", label: "École" },
  { id: "formation", label: "Centre de Formation" },
  { id: "ong", label: "ONG & Association" },
  { id: "coiffure", label: "Salon de Coiffure" },
  { id: "cooperative", label: "Coopérative" },
];

/** Valeur sentinelle pour l'option « + Ajouter une activité » dans le Select. */
export const SECTOR_CUSTOM_VALUE = "__custom";

/** Normalise l'orthographe d'un secteur saisi librement. */
export function normalizeSector(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
