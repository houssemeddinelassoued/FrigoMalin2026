import { expect, test } from "@playwright/test";

// Caméra simulée par Chromium (mire de test) : vérifie l'ouverture du scan et le
// chargement local du lecteur ZXing quand le BarcodeDetector natif est absent.
test.use({
  permissions: ["camera"],
  launchOptions: {
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  },
});

test("opens the camera and loads the barcode reader from the app, not a CDN", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://localhost")) external.push(request.url());
  });

  await page.goto("./#/ajouter");
  const hasNative = await page.evaluate(() => "BarcodeDetector" in globalThis);
  const wasm = hasNative
    ? undefined
    : page.waitForResponse((response) => /zxing_reader-.*\.wasm$/.test(response.url()));

  await page.getByRole("button", { name: "Scanner un code-barres" }).click();
  await expect(page.getByLabel("Aperçu caméra")).toBeVisible();
  if (wasm) expect((await wasm).ok()).toBe(true);
  await expect(page.getByText("Scan indisponible.")).toBeHidden();

  await page.getByRole("button", { name: "Arrêter le scan" }).click();
  await expect(page.getByLabel("Aperçu caméra")).toBeHidden();
  expect(external).toEqual([]);
});
