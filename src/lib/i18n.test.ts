import { describe, it, expect } from "vitest";
import { navLabel, resolveLocale } from "./i18n";

describe("i18n", () => {
  it("resolves locale with fallback to fr", () => {
    expect(resolveLocale("fr")).toBe("fr");
    expect(resolveLocale("en")).toBe("en");
    expect(resolveLocale("sw")).toBe("sw");
    expect(resolveLocale("xx")).toBe("fr");
    expect(resolveLocale(null)).toBe("fr");
    expect(resolveLocale(undefined)).toBe("fr");
  });

  it("translates navigation labels", () => {
    expect(navLabel("dashboard", "fr")).toBe("Tableau de bord");
    expect(navLabel("dashboard", "en")).toBe("Dashboard");
    expect(navLabel("crm", "sw")).toBe("CRM");
    expect(navLabel("settings", "en")).toBe("Settings");
    expect(navLabel("unknown", "fr")).toBe("unknown");
  });
});
