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
  // Coordonnées officielles de MORA Shawiri
  email: "contact@morashawiri.com",
  phoneDisplay: "+269 430 63 06",
  address: "Moroni Oasis, route des puffins",
  site: "www.morashawiri.com",
  // Réseaux sociaux MORA Shawiri
  socials: {
    facebook: "https://www.facebook.com/morashawiri",
    youtube: "https://www.youtube.com/@morashawiri",
    linkedin: "https://www.linkedin.com/in/morashawiri",
    instagram: "https://www.instagram.com/shawiridigital/",
    telegram: "https://t.me/@morashawiri",
    tiktok: "https://www.tiktok.com/@morashawiri",
  },
  // Devise par défaut
  currency: process.env.DEFAULT_CURRENCY ?? "KMF",
  country: process.env.DEFAULT_COUNTRY ?? "KM",
  // Langue de la plateforme : français (monolingue)
  locale: "fr",
  locales: ["fr"] as const,
} as const;

export type SiteConfig = typeof siteConfig;
