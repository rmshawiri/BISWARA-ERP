import { PLANS, PLAN_LABELS, type PlanKey } from "@/lib/constants";

export interface PlanDefinition {
  key: PlanKey;
  name: string;
  price: string;
  period: string;
  users: string;
  highlight: boolean;
  features: string[];
}

/**
 * Forfaits BISWARA (modèle économique — éléments PROTÉGÉS).
 * Ne pas modifier sans validation de MORA Shawiri.
 */
export const PLANS_LIST: PlanDefinition[] = [
  {
    key: PLANS.FREE,
    name: PLAN_LABELS[PLANS.FREE],
    price: "0 KMF",
    period: "/ mois",
    users: "1 utilisateur",
    highlight: false,
    features: [
      "Modules de base essentiels",
      "Tableau de bord",
      "Gestion simple",
      "Support communautaire",
    ],
  },
  {
    key: PLANS.STANDARD,
    name: PLAN_LABELS[PLANS.STANDARD],
    price: "5 000 KMF",
    period: "/ mois",
    users: "Jusqu'à 5 utilisateurs",
    highlight: false,
    features: [
      "Tous les modules de base",
      "CRM & ventes",
      "Stock",
      "Documents PDF",
    ],
  },
  {
    key: PLANS.BUSINESS,
    name: PLAN_LABELS[PLANS.BUSINESS],
    price: "10 000 KMF",
    period: "/ mois",
    users: "Jusqu'à 20 utilisateurs",
    highlight: true,
    features: [
      "Tout le forfait Standard",
      "Comptabilité & Finance",
      "Ressources Humaines & Paie",
      "Achats & Fournisseurs",
      "Support prioritaire",
    ],
  },
  {
    key: PLANS.VIP,
    name: PLAN_LABELS[PLANS.VIP],
    price: "20 000 KMF",
    period: "/ mois",
    users: "Utilisateurs illimités",
    highlight: false,
    features: [
      "Tous les modules + activités",
      "Logistique & Projets",
      "API & intégrations",
      "Accompagnement dédié",
    ],
  },
];
