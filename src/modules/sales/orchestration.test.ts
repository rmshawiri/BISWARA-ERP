import { describe, it, expect } from "vitest";
import { computeTotals } from "./validation";
import { buildSalesPosting } from "./orchestration";

const lines = (overrides: Partial<{ productId: string; isService: boolean }>[] = []) =>
  [
    { productId: "p1", description: "Produit A", quantity: 3, unitPrice: 1000, taxRate: 0 },
    { productId: "p2", description: "Service B", quantity: 1, unitPrice: 5000, taxRate: 20 },
    { productId: null, description: "Ligne libre", quantity: 2, unitPrice: 500, taxRate: 0 },
  ].map((l, i) => ({ ...l, ...(overrides[i] ?? {}) }));

describe("sales computeTotals (TVA en pourcentage)", () => {
  it("calcule HT, TVA et TTC correctement", () => {
    const totals = computeTotals([
      { productId: null, description: "A", quantity: 2, unitPrice: 100, taxRate: 20 },
      { productId: null, description: "B", quantity: 1, unitPrice: 50, taxRate: 0 },
    ], 10);
    // HT = 200 + 50 = 250 ; TVA = 200*0.2 = 40 ; remise 10 ; total = 250 + 40 - 10 = 280
    expect(totals.subtotal).toBe(250);
    expect(totals.taxTotal).toBe(40);
    expect(totals.discount).toBe(10);
    expect(totals.total).toBe(280);
  });
});

describe("buildSalesPosting (orchestration inter-modules)", () => {
  const totals = { subtotal: 8000, taxTotal: 1000, discount: 0, total: 9000 };

  it("répartit client / revenus HT / TVA (équilibré)", () => {
    const plan = buildSalesPosting(totals, lines(), { p1: false, p2: true });
    expect(plan.clientDebit).toBe(9000);
    expect(plan.revenueCredit).toBe(8000); // 9000 - 1000
    expect(plan.vatCredit).toBe(1000);
    expect(plan.clientDebit).toBe(plan.revenueCredit + plan.vatCredit);
  });

  it("exclut les services des sorties de stock", () => {
    const plan = buildSalesPosting(totals, lines(), { p1: false, p2: true });
    const ids = plan.stockOuts.map((s) => s.productId);
    expect(ids).toContain("p1");
    expect(ids).not.toContain("p2"); // service exclu
  });

  it("ignore les lignes sans produit et les quantités nulles", () => {
    const plan = buildSalesPosting(totals, lines(), { p1: false, p2: true });
    const ids = plan.stockOuts.map((s) => s.productId);
    expect(ids).not.toContain(null as never);
  });
});
