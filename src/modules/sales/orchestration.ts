/**
 * Gestion Commerciale — orchestration métier pure (testable sans base).
 * Décrit, à partir d'une facture validée, ce qui doit être propagé vers
 * la comptabilité (HT / TVA) et le stock (sorties de marchandises).
 */

import type { SalesLineInput, ComputedTotals } from "./validation";

export interface SalesPostingPlan {
  /** Débit client (créance) = total TTC. */
  clientDebit: number;
  /** Crédit revenus = HT (hors remise). */
  revenueCredit: number;
  /** Crédit TVA collectée. */
  vatCredit: number;
  /** Sorties de stock (produits physiques uniquement). */
  stockOuts: { productId: string; quantity: number }[];
}

/**
 * Construit le plan de propagation d'une facture validée.
 *
 * - Client (débit) = total TTC.
 * - Revenus (crédit) = HT = total - TVA (la remise réduit les revenus).
 * - TVA collectée (crédit) = total des taxes de lignes.
 * - Sorties de stock : lignes liées à un produit physique (hors service), qty > 0.
 *
 * Équilibre garanti : clientDebit = revenueCredit + vatCredit.
 */
export function buildSalesPosting(
  totals: ComputedTotals,
  lines: SalesLineInput[],
  isServiceMap: Record<string, boolean> = {}
): SalesPostingPlan {
  const clientDebit = totals.total;
  const vatCredit = totals.taxTotal;
  const revenueCredit = totals.total - totals.taxTotal;

  const stockOuts = lines
    .filter((l) => l.productId && !isServiceMap[l.productId] && l.quantity > 0)
    .map((l) => ({ productId: l.productId as string, quantity: l.quantity }));

  return { clientDebit, revenueCredit, vatCredit, stockOuts };
}
