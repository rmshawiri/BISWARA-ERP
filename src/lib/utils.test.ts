import { describe, it, expect } from "vitest";
import { formatCurrency, formatNumber } from "./utils";

describe("formatCurrency", () => {
  it("formate des KMF sans décimales", () => {
    const out = formatCurrency(12345, "KMF");
    expect(out).toContain("12");
    expect(out).toContain("345");
  });
});

describe("formatNumber", () => {
  it("sépare les milliers", () => {
    // fr-FR utilise une espace insécable fine (U+202F) comme séparateur.
    expect(formatNumber(1234567)).toMatch(/\d{1,3}[\u202f\u00a0 ]\d{3}[\u202f\u00a0 ]\d{3}/);
  });
});
