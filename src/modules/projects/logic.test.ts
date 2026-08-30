import { describe, it, expect } from "vitest";
import { aggregateProgress, taskStatus, isOverdue } from "./logic";

describe("aggregateProgress", () => {
  it("calcule l'avancement pondéré", () => {
    const p = aggregateProgress([
      { id: "a", progress: 100, weight: 2 },
      { id: "b", progress: 0, weight: 1 },
    ]);
    expect(p).toBe(66.67);
  });

  it("gère une liste vide", () => {
    expect(aggregateProgress([])).toBe(0);
  });
});

describe("taskStatus", () => {
  it("classe selon la progression", () => {
    expect(taskStatus(0)).toBe("todo");
    expect(taskStatus(50)).toBe("in_progress");
    expect(taskStatus(100)).toBe("done");
  });
});

describe("isOverdue", () => {
  it("détecte un dépassement d'échéance", () => {
    expect(isOverdue("2026-01-01", "2026-02-01")).toBe(true);
    expect(isOverdue("2026-03-01", "2026-02-01")).toBe(false);
  });
});
