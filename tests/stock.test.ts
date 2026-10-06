import "fake-indexeddb/auto";
import { afterEach, beforeEach, expect, test } from "vitest";
import { db } from "../src/data/db.ts";
import { monthlyImpact } from "../src/domain/impact.ts";
import type { StockItem } from "../src/domain/types.ts";
import {
  addItem,
  closeItem,
  createBackup,
  discardExpiredItems,
  importBackup,
  InvalidBackupError,
  parseBackup,
} from "../src/data/stock.ts";

const today = "2026-10-05";

beforeEach(async () => {
  await db.delete();
  await db.open();
});

afterEach(async () => {
  await db.delete();
});

test("closes an item once: repeating the declaration has no effect", async () => {
  const item = await addItem(
    {
      name: "Yaourt",
      quantity: 4,
      unit: "pièce",
      location: "réfrigérateur",
      dateKind: "DLC",
      expiresOn: "2026-10-07",
    },
    today,
  );
  expect(await closeItem(item.id, "congelé", today)).toBe(true);
  expect(await closeItem(item.id, "consommé", "2026-10-06")).toBe(false);
  expect(await db.stockItems.get(item.id)).toMatchObject({ status: "congelé", closedOn: today });
});

test("jette en une opération uniquement les DLC dépassées encore en stock", async () => {
  const items: StockItem[] = [
    {
      id: "dlc-depassee-1",
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
      id: "dlc-depassee-2",
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
      id: "ddm-depassee",
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
      id: "dlc-aujourdhui",
      name: "Lait",
      quantity: 1,
      unit: "l",
      expiresOn: today,
      dateKind: "DLC",
      location: "réfrigérateur",
      addedOn: "2026-09-28",
      status: "en-stock",
    },
    {
      id: "dlc-future",
      name: "Fromage",
      quantity: 1,
      unit: "pièce",
      expiresOn: "2026-10-06",
      dateKind: "DLC",
      location: "réfrigérateur",
      addedOn: "2026-09-28",
      status: "en-stock",
    },
    {
      id: "already-consumed",
      name: "Soupe",
      quantity: 1,
      unit: "l",
      expiresOn: "2026-10-01",
      dateKind: "DLC",
      location: "réfrigérateur",
      addedOn: "2026-09-28",
      status: "consommé",
      closedOn: "2026-10-02",
    },
    {
      id: "already-frozen",
      name: "Poisson",
      quantity: 1,
      unit: "kg",
      expiresOn: "2026-10-01",
      dateKind: "DLC",
      location: "congélateur",
      addedOn: "2026-09-28",
      status: "congelé",
      closedOn: "2026-10-02",
    },
    {
      id: "already-discarded",
      name: "Crème",
      quantity: 1,
      unit: "ml",
      expiresOn: "2026-10-01",
      dateKind: "DLC",
      location: "réfrigérateur",
      addedOn: "2026-09-28",
      status: "jeté",
      closedOn: "2026-10-02",
    },
  ];
  await db.stockItems.bulkAdd(items);
  const savedBefore = monthlyImpact(items, today).total;

  expect(await discardExpiredItems(today)).toBe(2);

  const stored = await db.stockItems.toArray();
  expect(stored).toHaveLength(items.length);
  expect(stored.find((item) => item.id === "dlc-depassee-1")).toEqual({
    ...items[0],
    status: "jeté",
    closedOn: today,
  });
  expect(stored.find((item) => item.id === "dlc-depassee-2")).toEqual({
    ...items[1],
    status: "jeté",
    closedOn: today,
  });
  expect(
    stored
      .filter((item) => item.status === "en-stock")
      .map((item) => item.id)
      .sort(),
  ).toEqual(["ddm-depassee", "dlc-aujourdhui", "dlc-future"]);
  for (const unchanged of items.slice(2)) {
    expect(stored.find((item) => item.id === unchanged.id)).toEqual(unchanged);
  }
  expect(monthlyImpact(stored, today).total).toBe(savedBefore);
  expect(await discardExpiredItems(today)).toBe(0);
  expect(await db.stockItems.toArray()).toEqual(stored);
});

test("annule toutes les écritures si une mise à jour du lot échoue", async () => {
  await db.stockItems.bulkAdd([
    {
      id: "premier",
      name: "Produit ancien",
      quantity: 1,
      unit: "pièce",
      expiresOn: "2026-10-01",
      dateKind: "DLC",
      location: "réfrigérateur",
      addedOn: "2026-09-28",
      status: "en-stock",
    },
    {
      id: "second",
      name: "Produit récent",
      quantity: 1,
      unit: "pièce",
      expiresOn: "2026-10-02",
      dateKind: "DLC",
      location: "réfrigérateur",
      addedOn: "2026-09-28",
      status: "en-stock",
    },
  ]);
  const before = await db.stockItems.toArray();
  const failOnSecond = (_changes: unknown, primaryKey: unknown) => {
    if (primaryKey === "second") throw new Error("Échec de stockage simulé.");
  };
  db.stockItems.hook("updating").subscribe(failOnSecond);
  try {
    await expect(discardExpiredItems(today)).rejects.toThrow("Échec de stockage simulé.");
  } finally {
    db.stockItems.hook("updating").unsubscribe(failOnSecond);
  }
  expect(await db.stockItems.toArray()).toEqual(before);
});

test("round-trips a backup and rejects invalid files with a clear message", async () => {
  await addItem(
    {
      name: "Riz",
      quantity: 1,
      unit: "kg",
      location: "placard",
      dateKind: "DDM",
      expiresOn: "2027-01-01",
      barcode: "3017620422003",
    },
    today,
  );
  const backup = JSON.stringify(await createBackup(today));
  await db.stockItems.clear();
  expect(await importBackup(backup)).toBe(1);
  expect(await db.stockItems.toArray()).toEqual(JSON.parse(backup).items);

  expect(() => parseBackup("pas du json")).toThrow(InvalidBackupError);
  expect(() => parseBackup('{"app":"autre"}')).toThrow("pas une sauvegarde FrigoMalin");
  const broken = JSON.parse(backup);
  broken.items[0].expiresOn = "01/01/2027";
  expect(() => parseBackup(JSON.stringify(broken))).toThrow("« expiresOn »");
});
