/**
 * WORKFLOW ENGINE — circuits d'approbation configurables par seuils de montant.
 * Tous les workflow de validation (achats, finance, RH, commercial) utilisent
 * ce moteur. Chaque organisation définit ses étapes.
 *
 * La logique de résolution est pure (testable) ; l'accès aux données est
 * séparé de `resolveWorkflow` pour rester testable sans base.
 */

export interface WorkflowStep {
  id: string;
  label: string;
  role: string;
  minAmount: number; // inclus
  maxAmount: number; // exclu (Infinity pour le dernier)
  order: number;
}

export type ApprovalDecision = "approved" | "pending" | "rejected";

export interface ApprovalResult {
  step: WorkflowStep | null;
  decision: ApprovalDecision;
}

export function isWithinRange(step: WorkflowStep, amount: number): boolean {
  return amount >= step.minAmount && amount < step.maxAmount;
}

/** Résout l'étape qui doit approuver un montant (chaîne par seuils). */
export function resolveWorkflowStep(
  amount: number,
  steps: WorkflowStep[]
): ApprovalResult {
  const sorted = [...steps].sort((a, b) => a.order - b.order);
  const step = sorted.find((s) => isWithinRange(s, amount));
  if (step) {
    return {
      step,
      decision: step.minAmount === 0 ? "approved" : "pending",
    };
  }
  return { step: null, decision: "rejected" };
}

/** Chaîne d'approbation descendante jusqu'à la validation finale. */
export function buildApprovalChain(
  amount: number,
  steps: WorkflowStep[]
): WorkflowStep[] {
  const sorted = [...steps].sort((a, b) => a.order - b.order);
  const target = sorted.find((s) => isWithinRange(s, amount));
  if (!target) return [];
  return sorted.filter((s) => s.order <= target.order);
}

/** Décide si un montant exige une approbation (seuil > 0 → approbation). */
export function requiresApproval(amount: number): boolean {
  return amount > 0;
}
