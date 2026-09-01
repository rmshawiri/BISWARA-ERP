import { describe, it, expect } from "vitest";
import { navLabel, resolveLocale } from "./i18n";

describe("i18n (français uniquement)", () => {
  it("résout toujours la locale fr", () => {
    expect(resolveLocale("fr")).toBe("fr");
    expect(resolveLocale("en")).toBe("fr");
    expect(resolveLocale("sw")).toBe("fr");
    expect(resolveLocale("xx")).toBe("fr");
    expect(resolveLocale(null)).toBe("fr");
    expect(resolveLocale(undefined)).toBe("fr");
  });

  it("retourne les libellés français", () => {
    expect(navLabel("dashboard", "fr")).toBe("Tableau de bord");
    expect(navLabel("sales", "fr")).toBe("Ventes");
    expect(navLabel("unknown", "fr")).toBe("unknown");
  });
});
