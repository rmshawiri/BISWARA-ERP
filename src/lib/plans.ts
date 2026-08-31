import { PLANS, PLAN_LABELS, MODULES, type PlanKey, type ModuleKey } from "@/lib/constants";

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
export const PLANS_LIST: PlanDefinition[] = [  {
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

// ============================================================
// Gating par forfait (Subscription Engine)
// ============================================================

const BASE_MODULES: ModuleKey[] = [
  MODULES.ADMIN,
  MODULES.SETTINGS,
  MODULES.NOTIFICATIONS,
  MODULES.CRM,
  MODULES.CATALOG,
  MODULES.SALES,
  MODULES.STOCK,
];

const STANDARD_MODULES: ModuleKey[] = [
  ...BASE_MODULES,
  MODULES.PURCHASES,
  MODULES.EMPLOYEE_PORTAL,
];

const BUSINESS_MODULES: ModuleKey[] = [
  ...STANDARD_MODULES,
  MODULES.FINANCE,
  MODULES.ACCOUNTING,
  MODULES.ASSETS,
  MODULES.HR,
  MODULES.LOGISTICS,
  MODULES.PROJECTS,
];

const ALL_MODULES: ModuleKey[] = Object.values(MODULES);

/** Modules accessibles pour un forfait donné. */
export const PLAN_MODULES: Record<PlanKey, ModuleKey[]> = {
  [PLANS.FREE]: BASE_MODULES,
  [PLANS.STANDARD]: STANDARD_MODULES,
  [PLANS.BUSINESS]: BUSINESS_MODULES,
  [PLANS.VIP]: ALL_MODULES,
};

/** Un forfait donne-t-il accès à un module ? */
export function planAllowsModule(plan: string, module: string): boolean {
  const allowed = (PLAN_MODULES as Record<string, ModuleKey[]>)[plan] ?? BASE_MODULES;
  return allowed.includes(module as ModuleKey);
}

/** Nombre maximal d'utilisateurs par forfait (Infinity = illimité). */
export function planUserLimit(plan: string): number {
  switch (plan) {
    case PLANS.FREE:
      return 1;
    case PLANS.STANDARD:
      return 5;
    case PLANS.BUSINESS:
      return 20;
    case PLANS.VIP:
      return Infinity;
    default:
      return 1;
  }
}
