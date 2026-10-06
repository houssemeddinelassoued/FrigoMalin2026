import "fake-indexeddb/auto";
import { render, screen, waitFor, within } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { App } from "../src/app.tsx";
import { db } from "../src/data/db.ts";
import { monthlyImpact } from "../src/domain/impact.ts";
import type { StockItem } from "../src/domain/types.ts";

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 5, 10));
  window.location.hash = "#/stock";
  await db.delete();
  await db.open();
});

afterEach(async () => {
  vi.useRealTimers();
  await db.delete();
});

test("adds a product manually, then declares it consumed and counts it as saved", async () => {
  const user = userEvent.setup();
  render(<App />);

  expect(await screen.findByText("Votre stock est vide")).toBeInTheDocument();
  await user.click(screen.getByRole("link", { name: "Ajouter un produit" }));

  await user.click(await screen.findByRole("button", { name: "Enregistrer le produit" }));
  expect(screen.getByText("Indiquez le nom de l'aliment.")).toBeInTheDocument();
  expect(screen.getByText("Indiquez une date de péremption valide.")).toBeInTheDocument();

  await user.type(screen.getByLabelText(/Nom de l'aliment/), "Yaourt nature");
  await user.click(screen.getByRole("button", { name: "+2 jours" }));
  await user.click(screen.getByRole("button", { name: "Enregistrer le produit" }));

  const priority = await screen.findByRole("region", { name: "À utiliser en priorité" });
  const card = within(priority).getByRole("article", { name: "Yaourt nature" });
  expect(within(card).getByText("À consommer sous 2 jours (DLC 07/10/2026)")).toBeInTheDocument();

  await user.click(within(card).getByRole("button", { name: "Consommé" }));
  expect(await screen.findByText(/\+1 aliment sauvé/)).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText("Votre stock est vide")).toBeInTheDocument());

  await user.click(screen.getByRole("link", { name: "Mon bilan" }));
  const count = await screen.findByText(
    (_, element) =>
      !!element?.classList.contains("bilan-count") &&
      /^1 aliment sauvé\b/.test(element.textContent),
  );
  expect(count).toBeInTheDocument();
});

test("offers only removal for an item whose DLC has passed", async () => {
  await db.stockItems.add({
    id: "jambon",
    name: "Jambon blanc",
    quantity: 4,
    unit: "pièce",
    expiresOn: "2026-10-03",
    dateKind: "DLC",
    location: "réfrigérateur",
    addedOn: "2026-09-28",
    status: "en-stock",
  });
  render(<App />);
  const card = await screen.findByRole("article", { name: "Jambon blanc" });
  expect(within(card).getByText(/DLC dépassée/)).toBeInTheDocument();
  expect(within(card).queryByRole("button", { name: "Consommé" })).not.toBeInTheDocument();
  expect(within(card).getByRole("button", { name: "Retirer du stock" })).toBeInTheDocument();
});

test("confirme et persiste le vidage des DLC dépassées sans compter de produits sauvés", async () => {
  const items: StockItem[] = [
    {
      id: "expired-a",
      name: "Yaourt",
      quantity: 2,
      unit: "pièce",
      expiresOn: "2026-10-03",
      dateKind: "DLC",
      location: "réfrigérateur",
      addedOn: "2026-09-28",
      status: "en-stock",
    },
    {
      id: "expired-b",
      name: "Poulet",
      quantity: 1,
      unit: "kg",
      expiresOn: "2026-10-04",
      dateKind: "DLC",
      location: "réfrigérateur",
      addedOn: "2026-09-28",
      status: "en-stock",
    },
    {
      id: "old-ddm",
      name: "Riz",
      quantity: 1,
      unit: "kg",
      expiresOn: "2026-10-01",
      dateKind: "DDM",
      location: "placard",
      addedOn: "2026-09-28",
      status: "en-stock",
    },
    {
      id: "today-dlc",
      name: "Lait",
      quantity: 1,
      unit: "l",
      expiresOn: "2026-10-05",
      dateKind: "DLC",
      location: "réfrigérateur",
      addedOn: "2026-09-28",
      status: "en-stock",
    },
    {
      id: "saved",
      name: "Pain",
      quantity: 1,
      unit: "pièce",
      expiresOn: "2026-10-03",
      dateKind: "DLC",
      location: "placard",
      addedOn: "2026-09-28",
      status: "consommé",
      closedOn: "2026-10-02",
    },
  ];
  await db.stockItems.bulkAdd(items);
  const savedBefore = monthlyImpact(items, "2026-10-05").total;
  const user = userEvent.setup();
  render(<App />);

  await user.click(await screen.findByRole("button", { name: "Vider les produits périmés" }));
  const dialog = screen.getByRole("dialog", {
    name: "Marquer ces 2 produits comme jetés ?",
  });
  expect(within(dialog).getByText("Marquer ces 2 produits comme jetés ?")).toBeInTheDocument();
  await user.click(within(dialog).getByRole("button", { name: "Marquer comme jetés" }));

  await waitFor(async () => {
    expect(await db.stockItems.get("expired-a")).toMatchObject({
      ...items[0],
      status: "jeté",
      closedOn: "2026-10-05",
    });
    expect(await db.stockItems.get("expired-b")).toMatchObject({
      ...items[1],
      status: "jeté",
      closedOn: "2026-10-05",
    });
  });
  const stored = await db.stockItems.toArray();
  expect(stored).toHaveLength(items.length);
  expect(stored.find((item) => item.id === "old-ddm")).toEqual(items[2]);
  expect(stored.find((item) => item.id === "today-dlc")).toEqual(items[3]);
  expect(stored.find((item) => item.id === "saved")).toEqual(items[4]);
  expect(monthlyImpact(stored, "2026-10-05").total).toBe(savedBefore);
  expect(await screen.findByText("2 produits marqués comme jetés.")).toBeInTheDocument();
});

test("affiche l'échec réel du stockage et conserve le stock après rollback du lot", async () => {
  const items: StockItem[] = ["premier", "second"].map((id) => ({
    id,
    name: `Produit ${id}`,
    quantity: 1,
    unit: "pièce",
    expiresOn: "2026-10-04",
    dateKind: "DLC",
    location: "réfrigérateur",
    addedOn: "2026-09-28",
    status: "en-stock",
  }));
  await db.stockItems.bulkAdd(items);
  const before = await db.stockItems.toArray();
  const failOnSecond = (_changes: unknown, primaryKey: unknown) => {
    if (primaryKey === "second") throw new Error("Échec de stockage simulé.");
  };
  db.stockItems.hook("updating").subscribe(failOnSecond);
  try {
    const user = userEvent.setup();
    render(<App />);
    const trigger = await screen.findByRole("button", { name: "Vider les produits périmés" });
    await waitFor(() => expect(trigger).toBeEnabled());
    await user.click(trigger);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Marquer comme jetés" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Impossible de vider les produits périmés : le stockage local a refusé la modification. Aucun produit n'a été modifié.",
    );
    expect(await db.stockItems.toArray()).toEqual(before);
    expect(screen.queryByText(/produits? marqués? comme jetés?/i)).not.toBeInTheDocument();
    expect(trigger).toBeEnabled();
    for (const item of items) {
      expect(screen.getByRole("article", { name: item.name })).toBeInTheDocument();
    }
  } finally {
    db.stockItems.hook("updating").unsubscribe(failOnSecond);
  }
});
