/**
 * Internationalisation (i18n) — socle minimal BISWARA.
 * Couvre la navigation et les libellés courants ; les pages restent
 * progressivement traduites (ajout au dictionnaire au fil des modules).
 */

export type Locale = "fr" | "en" | "sw";

export const LOCALES: Locale[] = ["fr", "en", "sw"];

export const LOCALE_LABELS: Record<Locale, string> = {
  fr: "FR",
  en: "EN",
  sw: "SW",
};

const NAV_TRANSLATIONS: Record<string, Record<Locale, string>> = {
  dashboard: { fr: "Tableau de bord", en: "Dashboard", sw: "Dashibodi" },
  crm: { fr: "CRM", en: "CRM", sw: "CRM" },
  catalog: { fr: "Catalogue", en: "Catalog", sw: "Katalogi" },
  purchases: { fr: "Achats", en: "Purchases", sw: "Manunuzi" },
  sales: { fr: "Ventes", en: "Sales", sw: "Mauzo" },
  stock: { fr: "Stock", en: "Stock", sw: "Hazina" },
  finance: { fr: "Finance", en: "Finance", sw: "Fedha" },
  accounting: { fr: "Comptabilité", en: "Accounting", sw: "Uhasibu" },
  assets: { fr: "Immobilisations", en: "Assets", sw: "Mali" },
  hr: { fr: "RH", en: "HR", sw: "Rasilimali" },
  projects: { fr: "Projets", en: "Projects", sw: "Miradi" },
  logistics: { fr: "Logistique", en: "Logistics", sw: "Usafirishaji" },
  settings: { fr: "Paramètres", en: "Settings", sw: "Mipangilio" },
  administration: { fr: "Administration", en: "Administration", sw: "Usimamizi" },
  audit: { fr: "Journal d'audit", en: "Audit log", sw: "Kumbukumbu" },
  rapports: { fr: "Rapports", en: "Reports", sw: "Ripoti" },
  portail: { fr: "Mon espace", en: "My space", sw: "Nafasi yangu" },
};

/** Traduit un libellé de navigation selon la locale. */
export function navLabel(key: string, locale: Locale): string {
  return NAV_TRANSLATIONS[key]?.[locale] ?? key;
}

/** Résout la locale depuis la valeur stockée (cookie ou défaut "fr"). */
export function resolveLocale(value: string | null | undefined): Locale {
  if (value && (LOCALES as string[]).includes(value)) return value as Locale;
  return "fr";
}

/** Lit la locale sélectionnée (côté client). */
export function getClientLocale(): Locale {
  if (typeof document === "undefined") return "fr";
  const m = document.cookie.match(/(?:^|;\s*)bwr_locale=([^;]+)/);
  return resolveLocale(m?.[1]);
}

/** Écrit la locale dans un cookie (côté client) et recharge. */
export function setClientLocale(locale: Locale): void {
  document.cookie = `bwr_locale=${locale}; path=/; max-age=31536000`;
  window.location.reload();
}
