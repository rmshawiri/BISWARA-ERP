import { siteConfig } from "@/lib/config";

/**
 * Construit un lien WhatsApp vers le numéro officiel BISWARA avec
 * un message pré-rempli (utilisé par les boutons Souscrire / Démo).
 */
export function buildWhatsAppLink(message: string): string {
  const number = siteConfig.whatsappNumber.replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** Message pré-rempli pour souscrire à un forfait. */
export function subscribeMessage(planLabel: string): string {
  return [
    "Bonjour,",
    "",
    `Je souhaite souscrire au forfait **${planLabel}** de BISWARA.`,
    "",
    "Merci de bien vouloir m'envoyer les modalités de paiement afin de finaliser mon inscription.",
    "",
    "Nom :",
    "Entreprise :",
    "Téléphone :",
    "",
    "Merci.",
  ].join("\n");
}

/** Message pré-rempli pour demander une démonstration. */
export function demoMessage(): string {
  return [
    "Bonjour,",
    "",
    "Je souhaite demander une démonstration de BISWARA.",
    "",
    "Nom :",
    "Entreprise :",
    "Téléphone :",
    "",
    "Merci.",
  ].join("\n");
}
