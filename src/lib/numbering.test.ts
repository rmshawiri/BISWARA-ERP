import { describe, it, expect } from "vitest";
import { buildDocumentNumber, parseDocumentNumber } from "./numbering";

describe("buildDocumentNumber", () => {
  it("formate un numéro {PREFIX}-{YEAR}-{SEQ} avec remplissage", () => {
    expect(buildDocumentNumber({ prefix: "FAC", year: 2026, seq: 1 })).toBe(
      "FAC-2026-000001"
    );
  });

  it("utilise un padding personnalisé", () => {
    expect(
      buildDocumentNumber({ prefix: "DEV", year: 2026, seq: 42, pad: 4 })
    ).toBe("DEV-2026-0042");
  });
});

describe("parseDocumentNumber", () => {
  it("parse un numéro valide", () => {
    expect(parseDocumentNumber("FAC-2026-000001")).toEqual({
      prefix: "FAC",
      year: 2026,
      seq: 1,
    });
  });

  it("retourne null pour un format invalide", () => {
    expect(parseDocumentNumber("invalide")).toBeNull();
  });
});
