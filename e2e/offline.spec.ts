import { expect, test } from "@playwright/test";

// Critère Must du MVP : charger en ligne, attendre le service worker, couper le
// réseau, recharger ; l'écran principal et le stock restent disponibles.
test("reloads the app and its local stock while offline", async ({ page, context }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Charger des données de démonstration" }).click();
  await expect(page.getByRole("region", { name: "À utiliser en priorité" })).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }),
      );
    }
  });

  await context.setOffline(true);
  const response = await page.reload();
  expect(response?.fromServiceWorker()).toBe(true);
  await expect(page.getByRole("heading", { name: "Mon stock", level: 1 })).toBeVisible();
  await expect(page.getByRole("region", { name: "À utiliser en priorité" })).toBeVisible();
  await expect(page.getByText("Hors ligne")).toBeVisible();

  await page.getByRole("link", { name: "Recettes" }).click();
  await expect(page.getByRole("heading", { name: "Idées recettes" })).toBeVisible();
});
