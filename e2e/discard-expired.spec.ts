import { expect, test } from "@playwright/test";

test("jette une DLC dépassée hors ligne et conserve le résultat après rechargement", async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date("2026-10-05T10:00:00") });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("./");
  await page.getByRole("link", { name: "Ajouter un produit" }).click();
  await page.getByLabel(/Nom de l'aliment/).fill("Yaourt périmé");
  await page.getByLabel("Date de péremption").fill("2026-10-04");
  await page.getByRole("button", { name: "Enregistrer le produit" }).click();
  await expect(page.getByRole("heading", { name: "Mon stock", level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Ajouter un produit" }).click();
  await page.getByLabel(/Nom de l'aliment/).fill("Crème périmée");
  await page.getByLabel("Date de péremption").fill("2026-10-03");
  await page.getByRole("button", { name: "Enregistrer le produit" }).click();
  await expect(page.getByRole("heading", { name: "Mon stock", level: 1 })).toBeVisible();

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }),
      );
    }
  });
  await context.setOffline(true);
  await expect(page.getByText("Hors ligne")).toBeVisible();

  await page.getByRole("button", { name: "Vider les produits périmés" }).click();
  const dialog = page.getByRole("dialog", {
    name: "Marquer ces 2 produits comme jetés ?",
  });
  await expect(dialog.getByText("Marquer ces 2 produits comme jetés ?")).toBeVisible();
  await dialog.getByRole("button", { name: "Marquer comme jetés" }).click();
  await expect(page.getByText("2 produits marqués comme jetés.")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Mon stock", level: 1 })).toBeVisible();
  await expect(page.getByText("Hors ligne")).toBeVisible();
  await expect(page.getByRole("button", { name: "Vider les produits périmés" })).toBeDisabled();

  const stored = await page.evaluate(
    () =>
      new Promise<Array<{ id: string; status: string; closedOn?: string }>>((resolve, reject) => {
        const request = indexedDB.open("frigomalin", 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const transaction = request.result.transaction("stockItems", "readonly");
          const read = transaction.objectStore("stockItems").getAll();
          read.onsuccess = () => resolve(read.result);
          read.onerror = () => reject(read.error);
        };
      }),
  );
  expect(stored).toHaveLength(2);
  expect(stored.every((item) => item.status === "jeté" && item.closedOn === "2026-10-05")).toBe(
    true,
  );
});
