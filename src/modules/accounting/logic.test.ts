import { describe, it, expect } from "vitest";
import { buildEntry, saleEntry } from "./logic";

describe("buildEntry", () => {
  it("valide une écriture équilibrée", () => {
    const r = buildEntry([
      { account: "411", label: "Client", debit: 1000, credit: 0 },
      { account: "707", label: "Ventes", debit: 0, credit: 1000 },
    ]);
    expect(r.balanced).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it("rejette une écriture déséquilibrée", () => {
    const r = buildEntry([
      { account: "411", label: "Client", debit: 1000, credit: 0 },
      { account: "707", label: "Ventes", debit: 0, credit: 500 },
    ]);
    expect(r.balanced).toBe(false);
  });

  it("rejette une ligne débit ET crédit simultanés", () => {
    const r = buildEntry([{ account: "411", label: "X", debit: 100, credit: 100 }]);
    expect(r.errors.length).toBeGreaterThan(0);
  });
});

describe("saleEntry", () => {
  it("produit une écriture de vente équilibrée", () => {
    const lines = saleEntry(2000, "411", "707");
    expect(buildEntry(lines).balanced).toBe(true);
  });
});
