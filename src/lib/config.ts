/**
 * Configuration centrale BISWARA.
 * Toutes les valeurs sensibles proviennent des variables d'environnement.
 * Aucun secret n'est codé en dur ici.
 */

// URL de base robuste (jamais vide) — utilisé pour metadataBase / og:url.
function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  const url = (raw && raw.trim()) || "http://localhost:3000";
  return url.replace(/\/+$/, "");
}

export const siteConfig = {
  name: "BISWARA ERP OS",
  shortName: "BISWARA",
  slogan: "Le Choix Optimal pour votre performance.",
  description:
    "BISWARA ERP OS — la plateforme ERP SaaS modulaire, multi-tenant et sécurisée pour piloter toute votre activité depuis une plateforme unique.",
  author: "MORA Shawiri",
  url: resolveSiteUrl(),
  // Numéro WhatsApp officiel (utilisé par les boutons Souscrire / Démo)
  whatsappNumber: process.env.NEXT_PUBLIC_BISWARA_WHATSAPP_NUMBER ?? "+2694306306",
  // Devise par défaut
  currency: process.env.DEFAULT_CURRENCY ?? "KMF",
  country: process.env.DEFAULT_COUNTRY ?? "KM",
  // Langues supportées (FR par défaut)
  locale: "fr",
  locales: ["fr", "en", "sw"] as const,
} as const;

export type SiteConfig = typeof siteConfig;
