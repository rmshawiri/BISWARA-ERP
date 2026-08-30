/**
 * Finance — logique métier pure (testable sans base).
 */

export interface PaymentAllocation {
  allocated: number;
  remaining: number; // solde restant de la facture
  overpayment: number; // trop-perçu (si > 0)
  status: "paid" | "partial" | "overpaid" | "open";
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Affecte un paiement à une facture et calcule le solde restant.
 * Gère paiement partiel, complet et trop-perçu (acompte/avoir).
 */
export function allocatePayment(
  paymentAmount: number,
  invoiceTotal: number,
  alreadyPaid = 0
): PaymentAllocation {
  const amount = round2(paymentAmount);
  const total = round2(invoiceTotal);
  const paid = round2(alreadyPaid);

  const newPaid = paid + amount;
  const remaining = round2(total - newPaid);

  if (remaining < 0) {
    return {
      allocated: round2(total - paid),
      remaining: 0,
      overpayment: round2(-remaining),
      status: "overpaid",
    };
  }
  if (remaining === 0) {
    return { allocated: amount, remaining: 0, overpayment: 0, status: "paid" };
  }
  if (paid > 0 || amount > 0) {
    return { allocated: amount, remaining, overpayment: 0, status: "partial" };
  }
  return { allocated: 0, remaining: total, overpayment: 0, status: "open" };
}

/** Solde d'une caisse : théorique = ouverture + encaissements - décaissements. */
export function cashBalance(
  opening: number,
  inflows: number,
  outflows: number,
  real: number
): { theoretical: number; gap: number } {
  const theoretical = round2(opening + inflows - outflows);
  const gap = round2(real - theoretical);
  return { theoretical, gap };
}
