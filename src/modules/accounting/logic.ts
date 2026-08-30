/**
 * Comptabilité — logique métier pure (testable sans base).
 */

export interface EntryLine {
  account: string;
  label: string;
  debit: number;
  credit: number;
}

export interface EntryBuildResult {
  lines: EntryLine[];
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
  errors: string[];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Construit une écriture comptable et vérifie son équilibre (Débit = Crédit).
 * Chaque ligne doit être univoque (débit OU crédit, jamais les deux).
 */
export function buildEntry(lines: EntryLine[]): EntryBuildResult {
  const errors: string[] = [];

  let totalDebit = 0;
  let totalCredit = 0;
  const clean: EntryLine[] = [];

  for (const l of lines) {
    const debit = round2(l.debit);
    const credit = round2(l.credit);
    if (debit > 0 && credit > 0) {
      errors.push(`Ligne "${l.label}" : débit et crédit ne peuvent être simultanés.`);
      continue;
    }
    if (debit < 0 || credit < 0) {
      errors.push(`Ligne "${l.label}" : montants négatifs interdits.`);
      continue;
    }
    if (debit === 0 && credit === 0) {
      errors.push(`Ligne "${l.label}" : montant nul.`);
      continue;
    }
    totalDebit += debit;
    totalCredit += credit;
    clean.push({ account: l.account, label: l.label, debit, credit });
  }

  const balanced = Math.abs(round2(totalDebit) - round2(totalCredit)) < 1e-9;

  return {
    lines: clean,
    totalDebit: round2(totalDebit),
    totalCredit: round2(totalCredit),
    balanced,
    errors,
  };
}

/** Écriture standard de vente : débit client (créance) / crédit revenus. */
export function saleEntry(amount: number, accountDebit: string, accountCredit: string): EntryLine[] {
  return [
    { account: accountDebit, label: "Client — vente", debit: amount, credit: 0 },
    { account: accountCredit, label: "Ventes de marchandises", debit: 0, credit: amount },
  ];
}
