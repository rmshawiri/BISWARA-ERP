import { describe, it, expect } from "vitest";
import { planAllowsModule, planUserLimit } from "./plans";
import { MODULES, PLANS } from "./constants";

describe("plans", () => {
  it("free enables base modules but not advanced ones", () => {
    expect(planAllowsModule(PLANS.FREE, MODULES.CRM)).toBe(true);
    expect(planAllowsModule(PLANS.FREE, MODULES.CATALOG)).toBe(true);
    expect(planAllowsModule(PLANS.FREE, MODULES.FINANCE)).toBe(false);
    expect(planAllowsModule(PLANS.FREE, MODULES.ACCOUNTING)).toBe(false);
    expect(planAllowsModule(PLANS.FREE, MODULES.HR)).toBe(false);
  });

  it("standard adds purchases + employee portal", () => {
    expect(planAllowsModule(PLANS.STANDARD, MODULES.PURCHASES)).toBe(true);
    expect(planAllowsModule(PLANS.STANDARD, MODULES.EMPLOYEE_PORTAL)).toBe(true);
    expect(planAllowsModule(PLANS.STANDARD, MODULES.FINANCE)).toBe(false);
  });

  it("business adds finance, accounting, assets, hr, logistics, projects", () => {
    expect(planAllowsModule(PLANS.BUSINESS, MODULES.FINANCE)).toBe(true);
    expect(planAllowsModule(PLANS.BUSINESS, MODULES.ACCOUNTING)).toBe(true);
    expect(planAllowsModule(PLANS.BUSINESS, MODULES.ASSETS)).toBe(true);
    expect(planAllowsModule(PLANS.BUSINESS, MODULES.HR)).toBe(true);
    expect(planAllowsModule(PLANS.BUSINESS, MODULES.LOGISTICS)).toBe(true);
    expect(planAllowsModule(PLANS.BUSINESS, MODULES.PROJECTS)).toBe(true);
  });

  it("vip enables all modules", () => {
    expect(planAllowsModule(PLANS.VIP, MODULES.LOGISTICS)).toBe(true);
    expect(planAllowsModule(PLANS.VIP, MODULES.ACTIVITIES)).toBe(true);
  });

  it("enforces user limits", () => {
    expect(planUserLimit(PLANS.FREE)).toBe(1);
    expect(planUserLimit(PLANS.STANDARD)).toBe(5);
    expect(planUserLimit(PLANS.BUSINESS)).toBe(20);
    expect(planUserLimit(PLANS.VIP)).toBe(Infinity);
  });

  it("falls back to base modules for unknown plans", () => {
    expect(planAllowsModule("nonexistent", MODULES.CRM)).toBe(true);
    expect(planAllowsModule("nonexistent", MODULES.FINANCE)).toBe(false);
  });
});
