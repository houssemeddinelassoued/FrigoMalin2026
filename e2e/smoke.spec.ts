import { expect, test } from "@playwright/test";

test("loads the app under the GitHub Pages base path and navigates by hash", async ({ page }) => {
  await page.goto("./");
  await expect(page).toHaveTitle("FrigoMalin");
  await expect(page.getByRole("heading", { name: "Mon stock", level: 1 })).toBeVisible();

  await page.getByRole("button", { name: "Charger des données de démonstration" }).click();
  await expect(page.getByRole("region", { name: "À utiliser en priorité" })).toBeVisible();

  await page.getByRole("link", { name: "Recettes" }).click();
  await expect(page).toHaveURL(/#\/recettes$/);
  await expect(page.getByRole("heading", { name: "Idées recettes" })).toBeVisible();

  // Le rechargement d'une vue conserve la route et les données locales.
  await page.reload();
  await expect(page.getByRole("heading", { name: "Idées recettes" })).toBeVisible();
  await expect(page.getByRole("article").first()).toBeVisible();
});
