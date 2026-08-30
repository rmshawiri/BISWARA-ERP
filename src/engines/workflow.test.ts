import { describe, it, expect } from "vitest";
import {
  resolveWorkflowStep,
  buildApprovalChain,
  requiresApproval,
  isWithinRange,
  type WorkflowStep,
} from "./workflow";

const steps: WorkflowStep[] = [
  { id: "auto", label: "Auto", role: "acheteur", minAmount: 0, maxAmount: 50000, order: 0 },
  { id: "resp", label: "Responsable Achats", role: "achats", minAmount: 50000, maxAmount: 500000, order: 1 },
  { id: "dg", label: "Direction Générale", role: "direction", minAmount: 500000, maxAmount: Infinity, order: 2 },
];

describe("isWithinRange", () => {
  it("détecte l'inclusion du seuil min et l'exclusion du max", () => {
    expect(isWithinRange(steps[0]!, 50000)).toBe(false);
    expect(isWithinRange(steps[0]!, 49999)).toBe(true);
  });
});

describe("resolveWorkflowStep", () => {
  it("valide automatiquement en dessous du premier seuil", () => {
    const r = resolveWorkflowStep(10000, steps);
    expect(r.decision).toBe("approved");
    expect(r.step?.id).toBe("auto");
  });

  it("demande le responsable pour 50k-500k", () => {
    const r = resolveWorkflowStep(150000, steps);
    expect(r.decision).toBe("pending");
    expect(r.step?.id).toBe("resp");
  });

  it("demande la direction au-delà de 500k", () => {
    const r = resolveWorkflowStep(900000, steps);
    expect(r.step?.id).toBe("dg");
  });
});

describe("buildApprovalChain", () => {
  it("retourne la chaîne jusqu'à l'étape cible", () => {
    const chain = buildApprovalChain(150000, steps);
    expect(chain.map((s) => s.id)).toEqual(["auto", "resp"]);
  });
});

describe("requiresApproval", () => {
  it("true si montant > 0", () => {
    expect(requiresApproval(1)).toBe(true);
    expect(requiresApproval(0)).toBe(false);
  });
});
