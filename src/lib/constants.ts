/**
 * Constantes métier centralisées BISWARA.
 * Les actions/permissions et rôles sont référencés ici pour éviter la
 * duplication et garantir la cohérence (DRY).
 */

export type RoleType = "super_admin" | "admin" | "manager" | "user";

export type PermissionAction =
  | "view"
  | "create"
  | "update"
  | "delete"
  | "validate"
  | "export"
  | "import"
  | "print"
  | "share"
  | "configure";

export const PERMISSION_ACTIONS: PermissionAction[] = [
  "view",
  "create",
  "update",
  "delete",
  "validate",
  "export",
  "import",
  "print",
  "share",
  "configure",
];

/** Modules de base (identifiants stables). */
export const MODULES = {
  ADMIN: "admin",
  SETTINGS: "settings",
  NOTIFICATIONS: "notifications",
  CRM: "crm",
  SALES: "sales",
  CATALOG: "catalog",
  STOCK: "stock",
  PURCHASES: "purchases",
  FINANCE: "finance",
  ACCOUNTING: "accounting",
  ASSETS: "assets",
  EMPLOYEE_PORTAL: "employee_portal",
  HR: "hr",
  LOGISTICS: "logistics",
  PROJECTS: "projects",
  ACTIVITIES: "activities",
} as const;

export type ModuleKey = (typeof MODULES)[keyof typeof MODULES];

/** Forfaits officiels (ne pas modifier sans validation de MORA Shawiri). */
export const PLANS = {
  FREE: "free",
  STANDARD: "standard",
  BUSINESS: "business",
  VIP: "vip",
} as const;

export type PlanKey = (typeof PLANS)[keyof typeof PLANS];

export const PLAN_LABELS: Record<PlanKey, string> = {
  [PLANS.FREE]: "Gratuit",
  [PLANS.STANDARD]: "Standard",
  [PLANS.BUSINESS]: "Business",
  [PLANS.VIP]: "VIP",
};

/** Statuts organisation. */
export const ORG_STATUS = {
  ACTIVE: "active",
  SUSPENDED: "suspended",
} as const;
