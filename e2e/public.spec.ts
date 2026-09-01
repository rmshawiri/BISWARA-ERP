import { test, expect } from "@playwright/test";

// Parcours publics — ne nécessitent ni authentification ni base de données
// (rendu serveur). Conviennent pour la CI et un `pnpm test:e2e` local.

const PAGES: [string, RegExp][] = [
  ["/", /BISWARA/],
  ["/pricing", /Tarifs/],
  ["/contact", /Contact/],
  ["/faq", /FAQ/i],
  ["/mentions", /Mentions/],
  ["/conditions", /Conditions/],
  ["/confidentialite", /Confidentialité/],
  ["/maintenance", /Maintenance/],
];

for (const [path, title] of PAGES) {
  test(`la page ${path} se charge avec son titre`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveTitle(title);
    await expect(page.locator("h1").first()).toBeVisible();
  });
}

test("la page contact affiche les coordonnées MORA Shawiri", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.getByText(/morashawiri/i).first()).toBeVisible();
});

test("la page login affiche le formulaire", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByPlaceholder(/vous@entreprise|rachade/)).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
});

test("la page signup charge le parcours d'inscription", async ({ page }) => {
  await page.goto("/signup");
  await expect(page).toHaveTitle(/BISWARA/i);
});

// NOTE : les parcours authentifiés (login → CRUD → doc PDF) nécessitent une
// base Supabase réelle + un compte seed ; à ajouter dans un environnement dédié.
