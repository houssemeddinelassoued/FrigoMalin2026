import { addProduct, expect, test, viewports, waitForServiceWorkerControl } from "./fixtures.ts";

for (const viewport of viewports) {
  test.describe(`Hors ligne — ${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport });

    test("passer hors ligne puis recharger ne perd aucune donnée", async ({
      freshApp: page,
      context,
    }) => {
      await addProduct(page, { name: "Jambon blanc", dateKind: "DLC", expiresOn: "2026-10-07" });
      await addProduct(page, { name: "Farine", dateKind: "DDM", expiresOn: "2026-09-30" });
      await waitForServiceWorkerControl(page);

      await context.setOffline(true);
      await expect(page.getByRole("status").filter({ hasText: "Hors ligne" })).toBeVisible();
      // Une saisie faite hors ligne doit, elle aussi, survivre au rechargement.
      await addProduct(page, { name: "Œufs", dateKind: "DLC", expiresOn: "2026-10-20" });

      const response = await page.reload();
      expect(response?.fromServiceWorker()).toBe(true);
      await expect(page.getByRole("heading", { name: "Mon stock", level: 1 })).toBeVisible();
      await expect(page.getByRole("status").filter({ hasText: "Hors ligne" })).toBeVisible();

      await expect(
        page
          .getByRole("region", { name: "À utiliser en priorité" })
          .getByRole("article", { name: "Jambon blanc" }),
      ).toBeVisible();
      const rest = page.getByRole("region", { name: "Reste du stock actif" });
      await expect(rest.getByRole("heading", { level: 3 })).toHaveText(["Farine", "Œufs"]);
      await expect(rest.getByRole("article", { name: "Farine" })).toContainText(
        "DDM dépassée (30/09/2026) — peut encore être consommé",
      );
    });
  });
}
