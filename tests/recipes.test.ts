import { expect, test } from "vitest";
import { monthlyImpact, isSaved } from "../src/domain/impact.ts";
import { normalizeName, suggestRecipes, type CatalogRecipe } from "../src/domain/recipes.ts";
import type { StockItem } from "../src/domain/types.ts";

const today = "2026-10-05";

function item(overrides: Partial<StockItem> & Pick<StockItem, "name">): StockItem {
  return {
    id: overrides.name,
    quantity: 1,
    unit: "pièce",
    expiresOn: "2026-10-20",
    dateKind: "DLC",
    location: "réfrigérateur",
    addedOn: "2026-10-01",
    status: "en-stock",
    ...overrides,
  };
}

const omelette: CatalogRecipe = {
  id: "omelette",
  title: "Omelette",
  minutes: 10,
  difficulty: "Facile",
  steps: [],
  ingredients: [
    { name: "Œufs", quantity: 3, unit: "pièce" },
    { name: "Crème fraîche", quantity: 50, unit: "ml" },
  ],
};

test("matches ingredients without accents or ligatures", () => {
  expect(normalizeName("Œufs frais")).toBe("oeufs frais");
  const [suggestion] = suggestRecipes(
    [item({ name: "Oeufs bio" }), item({ name: "Creme fraiche" })],
    [omelette],
    today,
  );
  expect(suggestion?.used.map((used) => used.name)).toEqual(["Oeufs bio", "Creme fraiche"]);
});

test("never proposes an ingredient whose DLC has passed", () => {
  const [suggestion] = suggestRecipes(
    [
      item({ name: "Crème fraîche", expiresOn: "2026-10-04" }),
      item({ name: "Œufs", dateKind: "DDM", expiresOn: "2026-10-01" }),
    ],
    [omelette],
    today,
  );
  expect(suggestion?.used.map((used) => used.name)).toEqual(["Œufs"]);
});

test("uses the item with the nearest date first", () => {
  const recipes = suggestRecipes(
    [
      item({ id: "late", name: "Œufs", expiresOn: "2026-10-30" }),
      item({ id: "soon", name: "Œufs", expiresOn: "2026-10-06" }),
    ],
    [omelette],
    today,
  );
  expect(recipes[0]?.used[0]?.id).toBe("soon");
  expect(recipes[0]?.urgent).toBe(1);
});

test("counts only declarations made on or before the date, for the current month", () => {
  const items = [
    item({ name: "a", status: "consommé", closedOn: today, expiresOn: today }),
    item({ name: "b", status: "congelé", closedOn: "2026-10-02" }),
    item({ name: "c", status: "consommé", closedOn: today, expiresOn: "2026-10-04" }),
    item({ name: "d", status: "jeté", closedOn: today }),
    item({ name: "e", status: "consommé", closedOn: "2026-09-30" }),
  ];
  expect(items.map(isSaved)).toEqual([true, true, false, false, true]);
  expect(monthlyImpact(items, today)).toEqual({ consumed: 1, frozen: 1, total: 2 });
});
