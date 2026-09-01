/**
 * BISWARA — langue de la plateforme : FRANÇAIS uniquement.
 * (L'internationalisation EN/SW a été retirée ; tout le produit est en français.)
 */

export type Locale = "fr";

export const LOCALES: Locale[] = ["fr"];

export const LOCALE_LABELS: Record<Locale, string> = {
  fr: "FR",
};

/** Libellés de navigation (français). */
const NAV_LABELS: Record<string, string> = {
  dashboard: "Tableau de bord",
  crm: "CRM",
  catalog: "Catalogue",
  purchases: "Achats",
  sales: "Ventes",
  stock: "Stock",
  finance: "Finance",
  accounting: "Comptabilité",
  assets: "Immobilisations",
  hr: "RH",
  projects: "Projets",
  logistics: "Logistique",
  settings: "Paramètres",
  administration: "Administration",
  audit: "Journal d'audit",
  rapports: "Rapports",
  portail: "Mon espace",
};

/** Traduit un libellé de navigation (toujours en français). */
export function navLabel(key: string, _locale?: Locale): string {
  return NAV_LABELS[key] ?? key;
}

/** Résout toujours la locale « fr » (plateforme monolingue). */
export function resolveLocale(_value?: string | null): Locale {
  return "fr";
}

/** Lit la locale (toujours « fr »). */
export function getClientLocale(): Locale {
  return "fr";
}

/** Aucune autre langue à sélectionner ; ne fait rien de plus que forcer « fr ». */
export function setClientLocale(_locale: Locale): void {
  document.cookie = "bwr_locale=fr; path=/; max-age=31536000";
  window.location.reload();
}
