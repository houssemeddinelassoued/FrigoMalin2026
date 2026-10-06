import { addProduct, expect, expectNoHorizontalScroll, test, viewports } from "./fixtures.ts";

for (const viewport of viewports) {
  test.describe(`Tri par urgence — ${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport });

    test("un produit ajouté apparaît à sa place dans le stock trié par urgence", async ({
      freshApp: page,
    }) => {
      await addProduct(page, {
        name: "Lait demi-écrémé",
        dateKind: "DLC",
        expiresOn: "2026-10-12",
      });
      await addProduct(page, { name: "Yaourt nature", dateKind: "DLC", expiresOn: "2026-10-09" });
      await addProduct(page, { name: "Riz basmati", dateKind: "DDM", expiresOn: "2026-10-06" });

      await addProduct(page, { name: "Jambon blanc", dateKind: "DLC", expiresOn: "2026-10-07" });
      await expect(
        page.getByRole("status").filter({ hasText: "« Jambon blanc » ajouté au stock." }),
      ).toBeVisible();

      const priority = page.getByRole("region", { name: "À utiliser en priorité" });
      await expect(priority.getByRole("heading", { level: 3 })).toHaveText([
        "Riz basmati",
        "Jambon blanc",
        "Yaourt nature",
      ]);
      await expect(priority.getByRole("article", { name: "Jambon blanc" })).toContainText(
        "À consommer sous 1 jour (DLC 07/10/2026)",
      );
      await expect(priority.getByRole("article", { name: "Riz basmati" })).toContainText(
        "De préférence aujourd'hui (DDM 06/10/2026)",
      );

      const rest = page.getByRole("region", { name: "Reste du stock actif" });
      await expect(rest.getByRole("heading", { level: 3 })).toHaveText(["Lait demi-écrémé"]);
      await expect(rest.getByRole("article", { name: "Lait demi-écrémé" })).toContainText(
        "DLC 12/10/2026",
      );

      // Le tri survit au rechargement : il vient des données locales, pas de l'ordre de saisie.
      await page.reload();
      await expect(priority.getByRole("heading", { level: 3 })).toHaveText([
        "Riz basmati",
        "Jambon blanc",
        "Yaourt nature",
      ]);
      await expectNoHorizontalScroll(page);
    });
  });
}
