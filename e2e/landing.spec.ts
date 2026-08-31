import { test, expect } from "@playwright/test";

test("landing page se charge avec le titre BISWARA", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/BISWARA/);
  await expect(page.locator("h1").first()).toBeVisible();
});

test("la page pricing expose les forfaits", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page).toHaveTitle(/Tarifs/);
  await expect(page.getByText("Gratuit").first()).toBeVisible();
  await expect(page.getByText("Business").first()).toBeVisible();
});
