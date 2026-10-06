import { expect, test as base, type Page } from "@playwright/test";

export const viewports = [
  { width: 360, height: 800 },
  { width: 1280, height: 800 },
] as const;

/** Mardi 6 octobre 2026, 10 h à Paris (heure d'été). */
export const NOW = new Date("2026-10-06T10:00:00+02:00");

/**
 * Horloge figée, fuseau Europe/Paris et base IndexedDB vidée avant chaque test :
 * le stock part toujours vide, quel que soit l'état laissé par un autre test.
 */
export const test = base.extend<{ freshApp: Page }>({
  timezoneId: "Europe/Paris",
  locale: "fr-FR",
  freshApp: async ({ page }, provide) => {
    await page.clock.install({ time: NOW });
    // Suppression mise en file avant l'ouverture de Dexie, une seule fois par onglet :
    // les rechargements du test conservent ensuite les données.
    await page.addInitScript(() => {
      if (sessionStorage.getItem("e2e-db-reset")) return;
      sessionStorage.setItem("e2e-db-reset", "1");
      indexedDB.deleteDatabase("frigomalin");
    });
    await page.goto("./");
    await expect(page.getByRole("heading", { name: "Votre stock est vide" })).toBeVisible();
    await provide(page);
  },
});

export { expect };

export async function addProduct(
  page: Page,
  product: { name: string; dateKind: "DLC" | "DDM"; expiresOn: string },
) {
  await page.getByRole("link", { name: "Ajouter un produit" }).click();
  await page.getByLabel(/Nom de l'aliment/).fill(product.name);
  await page.getByRole("radio", { name: new RegExp(`^${product.dateKind} •`) }).check();
  await page.getByLabel("Date de péremption").fill(product.expiresOn);
  await page.getByRole("button", { name: "Enregistrer le produit" }).click();
  await expect(page.getByRole("heading", { name: "Mon stock", level: 1 })).toBeVisible();
  await expect(page.getByRole("article", { name: product.name })).toBeVisible();
}

export async function waitForServiceWorkerControl(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }),
      );
    }
  });
}

export async function expectNoHorizontalScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
}
