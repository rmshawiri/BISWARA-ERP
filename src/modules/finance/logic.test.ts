import { describe, it, expect } from "vitest";
import { allocatePayment, cashBalance } from "./logic";

describe("allocatePayment", () => {
  it("paie entièrement une facture", () => {
    const r = allocatePayment(1000, 1000);
    expect(r.status).toBe("paid");
    expect(r.remaining).toBe(0);
    expect(r.overpayment).toBe(0);
  });

  it("détecte un paiement partiel", () => {
    const r = allocatePayment(400, 1000);
    expect(r.status).toBe("partial");
    expect(r.remaining).toBe(600);
  });

  it("détecte un trop-perçu", () => {
    const r = allocatePayment(1200, 1000);
    expect(r.status).toBe("overpaid");
    expect(r.overpayment).toBe(200);
  });
});

describe("cashBalance", () => {
  it("calcule le solde théorique et l'écart", () => {
    const r = cashBalance(5000, 3000, 1000, 7000);
    expect(r.theoretical).toBe(7000);
    expect(r.gap).toBe(0);
  });

  it("signale un écart", () => {
    const r = cashBalance(5000, 3000, 1000, 6800);
    expect(r.gap).toBe(-200);
  });
});
