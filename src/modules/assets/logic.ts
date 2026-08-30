/**
 * Immobilisations & Gestion des Actifs — logique métier pure (testable).
 *
 * Méthodes d'amortissement supportées : linéaire, dégressive (approximation),
 * personnalisée. Les écritures comptables sont générées séparément.
 */

export interface AmortizationInput {
  cost: number;
  usefulLife: number; // années
  residualValue?: number;
}

export interface AmortizationResult {
  annual: number; // dotation annuelle
  bookValueAt: (yearIndex: number) => number;
  nbYears: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Amortissement linéaire : (coût − valeur résiduelle) / durée de vie. */
export function linearAmortization(
  input: AmortizationInput
): AmortizationResult {
  const cost = round2(input.cost);
  const residual = round2(input.residualValue ?? 0);
  const life = Math.max(1, Math.round(input.usefulLife));
  const depreciable = cost - residual;
  const annual = round2(depreciable / life);
  return {
    annual,
    nbYears: life,
    bookValueAt: (yearIndex: number) => {
      const years = Math.min(Math.max(yearIndex, 0), life);
      const v = cost - annual * years;
      return round2(Math.max(v, residual));
    },
  };
}

/** Valeur nette comptable après n années (linéaire). */
export function netBookValue(
  cost: number,
  usefulLife: number,
  residualValue: number,
  elapsedYears: number
): number {
  const a = linearAmortization({ cost, usefulLife, residualValue });
  return a.bookValueAt(elapsedYears);
}

/** Amortissement dégressif (taux constant sur valeur comptable). */
export function decliningAmortization({
  cost,
  usefulLife,
  rate,
}: {
  cost: number;
  usefulLife: number;
  rate: number;
}): AmortizationResult {
  const annual = round2(cost * rate);
  const life = Math.max(1, Math.round(usefulLife));
  return {
    annual,
    nbYears: life,
    bookValueAt: (yearIndex: number) => {
      const years = Math.min(Math.max(yearIndex, 0), life);
      const v = cost * Math.pow(1 - rate, years);
      return round2(v);
    },
  };
}
