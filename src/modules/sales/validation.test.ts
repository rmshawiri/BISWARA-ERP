import { describe, it, expect } from "vitest";
import { computeTotals, type SalesLineInput } from "./validation";

describe("computeTotals", () => {
  const lines: SalesLineInput[] = [
    { description: "Produit A", quantity: 2, unitPrice: 1000, taxRate: 20 },
    { description: "Service B", quantity: 1, unitPrice: 500, taxRate: 0 },
  ];

  it("calcule sous-total, TVA et total sans remise", () => {
    const t = computeTotals(lines, 0);
    expect(t.subtotal).toBe(2500);
    expect(t.taxTotal).toBe(400); // 2000 * 0.20 (taxRate en %)
    expect(t.discount).toBe(0);
    expect(t.total).toBe(2900);
  });

  it("applique une remise", () => {
    const t = computeTotals(lines, 300);
    expect(t.total).toBe(2600);
  });

  it("gère des lignes vides", () => {
    expect(computeTotals([], 0)).toEqual({
      subtotal: 0,
      taxTotal: 0,
      discount: 0,
      total: 0,
    });
  });
});
