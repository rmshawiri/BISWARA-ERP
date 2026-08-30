import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Fusionne intelligemment les classes Tailwind (shadcn/ui convention).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formate un montant selon une devise donnée (KMF par défaut).
 */
export function formatCurrency(amount: number, currency = "KMF"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formate une date au format ISO->lisible (fr-FR).
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/**
 * Retourne un identifiant unique à usage local (côté client).
 */
export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

/**
 * Convertit un nombre/montant en chaîne avec séparateurs de milliers.
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n);
}
