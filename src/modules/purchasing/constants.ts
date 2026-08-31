import type { WorkflowStep } from "@/engines/workflow";

/**
 * Chaîne d'approbation par défaut pour les documents d'achat.
 * Configurable par organisation à terme (Workflow Engine).
 */
export const PURCHASE_WORKFLOW_STEPS: WorkflowStep[] = [
  { id: "manager", label: "Manager", role: "manager", minAmount: 0, maxAmount: 500000, order: 1 },
  { id: "director", label: "Direction", role: "admin", minAmount: 500000, maxAmount: 5000000, order: 2 },
  { id: "final", label: "Validation finale", role: "admin", minAmount: 5000000, maxAmount: Infinity, order: 3 },
];
