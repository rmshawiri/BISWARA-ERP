import { describe, it, expect } from "vitest";
import { leaveBalance, attendanceStatus } from "./logic";

describe("leaveBalance", () => {
  it("calcule le solde disponible", () => {
    expect(leaveBalance({ entitlement: 30, taken: 10, requested: 5 })).toEqual({
      available: 20,
      remainingAfter: 15,
      overLimit: false,
    });
  });

  it("détecte une demande qui dépasse le solde", () => {
    expect(leaveBalance({ entitlement: 30, taken: 10, requested: 25 }).overLimit).toBe(true);
  });
});

describe("attendanceStatus", () => {
  it("classe présent / retard / absent", () => {
    expect(attendanceStatus("08:00", "08:00")).toBe("present");
    expect(attendanceStatus("08:00", "08:45")).toBe("late");
    expect(attendanceStatus("08:00", "11:00")).toBe("absent");
  });
});
