import { describe, it, expect } from "vitest";
import { linearAmortization, netBookValue, decliningAmortization } from "./logic";

describe("linearAmortization", () => {
  const a = linearAmortization({ cost: 100000, usefulLife: 5, residualValue: 0 });
  it("calcule la dotation annuelle", () => {
    expect(a.annual).toBe(20000);
  });
  it("calcule la valeur nette au fil des années", () => {
    expect(a.bookValueAt(0)).toBe(100000);
    expect(a.bookValueAt(3)).toBe(40000);
    expect(a.bookValueAt(5)).toBe(0);
  });
});

describe("netBookValue", () => {
  it("borne à la valeur résiduelle", () => {
    expect(netBookValue(100000, 5, 10000, 10)).toBe(10000);
  });
});

describe("decliningAmortization", () => {
  it("calcule la valeur décroissante", () => {
    const d = decliningAmortization({ cost: 100000, usefulLife: 5, rate: 0.2 });
    expect(d.bookValueAt(0)).toBe(100000);
    expect(d.bookValueAt(1)).toBe(80000);
  });
});
