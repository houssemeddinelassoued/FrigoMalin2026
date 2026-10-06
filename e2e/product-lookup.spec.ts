import { expect, test, type Page } from "@playwright/test";

const OFF_PATTERN = "https://world.openfoodfacts.org/**";
const BARCODE = "3017620422003";

async function verifyBarcode(page: Page) {
  await page.goto("./#/ajouter");
  await page.getByLabel(/Saisie manuelle du code-barres/).fill(BARCODE);
  await page.getByRole("button", { name: "Vérifier" }).click();
}

test("produit trouvé : nom et quantité préremplis sans la marque", async ({ page }) => {
  await page.route(OFF_PATTERN, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: BARCODE,
        status: 1,
        product: { product_name_fr: "Pâte à tartiner", brands: "Marque", quantity: "500 g" },
      }),
    }),
  );
  await verifyBarcode(page);

  await expect(page.getByText(/Produit identifié : nom et quantité préremplis/)).toBeVisible();
  await expect(page.getByLabel(/Nom de l'aliment/)).toHaveValue("Pâte à tartiner");
  await expect(page.getByLabel("Quantité", { exact: true })).toHaveValue("500");
  await expect(page.getByLabel("Unité")).toHaveValue("g");
});

test("produit inconnu : invite à la saisie manuelle", async ({ page }) => {
  await page.route(OFF_PATTERN, (route) =>
    route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ code: BARCODE, status: 0, status_verbose: "product not found" }),
    }),
  );
  await verifyBarcode(page);

  await expect(page.getByText(/Produit introuvable dans Open Food Facts/)).toBeVisible();
  await expect(page.getByLabel(/Nom de l'aliment/)).toHaveValue("");
});

test("réponse lente : abandon après le délai, saisie manuelle possible", async ({ page }) => {
  await page.route(OFF_PATTERN, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 8000));
    await route.fulfill({ status: 200, body: "{}" }).catch(() => undefined);
  });
  await verifyBarcode(page);

  await expect(page.getByText(/Open Food Facts ne répond pas assez vite/)).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByLabel(/Nom de l'aliment/)).toBeEditable();
});

test("hors ligne : recherche désactivée, aucune requête et saisie manuelle complète", async ({
  page,
  context,
}) => {
  const offRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("openfoodfacts")) offRequests.push(request.url());
  });
  await page.goto("./#/ajouter");
  await context.setOffline(true);
  await page.getByLabel(/Saisie manuelle du code-barres/).fill(BARCODE);

  await expect(page.getByText(/Hors ligne : la saisie manuelle reste complète/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Vérifier" })).toBeDisabled();
  await page.getByLabel(/Nom de l'aliment/).fill("Yaourt nature");
  await expect(page.getByLabel(/Nom de l'aliment/)).toHaveValue("Yaourt nature");
  expect(offRequests).toEqual([]);
  await context.setOffline(false);
});
