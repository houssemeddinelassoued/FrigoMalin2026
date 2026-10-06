import { addProduct, expect, test, viewports } from "./fixtures.ts";
import type { Page } from "@playwright/test";

async function openImpact(page: Page) {
  await page.getByRole("link", { name: "Mon bilan" }).click();
  await expect(page.getByRole("heading", { name: "Mon bilan", level: 1 })).toBeVisible();
  return page.getByRole("region", { name: "Bilan de préservation" });
}

for (const viewport of viewports) {
  test.describe(`Bilan d'impact — ${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport });

    test("marquer un produit consommé met à jour le tableau d'impact", async ({
      freshApp: page,
    }) => {
      await addProduct(page, { name: "Yaourt nature", dateKind: "DLC", expiresOn: "2026-10-08" });
      await addProduct(page, { name: "Pâtes", dateKind: "DDM", expiresOn: "2027-03-01" });

      let impact = await openImpact(page);
      await expect(impact).toContainText("Octobre 2026");
      await expect(impact).toContainText("0 aliment sauvé");
      const consumed = impact.getByRole("listitem").filter({ hasText: "Consommés à temps" });
      const frozen = impact.getByRole("listitem").filter({ hasText: "Mis au congélateur à temps" });
      await expect(consumed).toContainText("0 produits");
      await expect(frozen).toContainText("0 produits");

      await page.getByRole("link", { name: "Mon stock" }).click();
      const yogurt = page.getByRole("article", { name: "Yaourt nature" });
      await yogurt.getByRole("button", { name: "Consommé", exact: true }).click();
      await expect(
        page
          .getByRole("status")
          .filter({ hasText: "« Yaourt nature » déclaré consommé. +1 aliment sauvé !" }),
      ).toBeVisible();
      await expect(yogurt).toHaveCount(0);
      await expect(page.getByRole("article", { name: "Pâtes" })).toBeVisible();

      impact = await openImpact(page);
      await expect(impact).toContainText("1 aliment sauvé");
      await expect(
        impact.getByRole("listitem").filter({ hasText: "Consommés à temps" }),
      ).toContainText("1 produits");
      await expect(
        impact.getByRole("listitem").filter({ hasText: "Mis au congélateur à temps" }),
      ).toContainText("0 produits");

      await page.reload();
      await expect(page.getByRole("region", { name: "Bilan de préservation" })).toContainText(
        "1 aliment sauvé",
      );
    });
  });
}
