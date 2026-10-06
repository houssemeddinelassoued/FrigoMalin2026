import { describe, expect, test } from "vitest";
import { addDays } from "./dates.ts";
import { suggestRecipes } from "./recipes.ts";
import type { ISODate, Recipe, StockItem } from "./types.ts";

const today: ISODate = "2026-10-05";

function inDays(days: number): ISODate {
  return addDays(today, days);
}

function item(overrides: Partial<StockItem> & Pick<StockItem, "name">): StockItem {
  return {
    id: overrides.name,
    quantity: 1,
    unit: "pièce",
    expiresOn: inDays(30),
    dateKind: "DLC",
    location: "réfrigérateur",
    addedOn: "2026-10-01",
    status: "en-stock",
    ...overrides,
  };
}

function recipe(title: string, ...ingredients: string[]): Recipe {
  return {
    id: title,
    title,
    minutes: 10,
    ingredients: ingredients.map((name) => ({ name, quantity: 1, unit: "pièce" })),
  };
}

/** Résultat réduit à ce que le contrat expose : recette, score, produits utilisés. */
function summarize(stock: StockItem[], recipes: Recipe[]) {
  return suggestRecipes(stock, recipes, today).map((s) => ({
    id: s.recipe.id,
    score: s.score,
    used: s.used.map((used) => used.id),
  }));
}

describe("suggestRecipes — score", () => {
  test("+1 per available ingredient, missing ingredients score nothing", () => {
    expect(
      summarize(
        [item({ name: "Œufs" }), item({ name: "Lait" })],
        [recipe("Crêpes", "Œufs", "Lait", "Farine")],
      ),
    ).toEqual([{ id: "Crêpes", score: 2, used: ["Œufs", "Lait"] }]);
  });

  test.each([
    [0, 4],
    [1, 4],
    [2, 4],
    [3, 3],
    [4, 3],
    [5, 3],
    [6, 1],
  ])("an ingredient expiring in %i day(s) scores %i", (days, score) => {
    expect(
      summarize([item({ name: "Œufs", expiresOn: inDays(days) })], [recipe("Omelette", "Œufs")]),
    ).toEqual([{ id: "Omelette", score, used: ["Œufs"] }]);
  });

  test("a product past its DLC is not available", () => {
    expect(
      summarize(
        [
          item({ name: "Crème", dateKind: "DLC", expiresOn: inDays(-1) }),
          item({ name: "Œufs" }),
        ],
        [recipe("Omelette", "Œufs", "Crème")],
      ),
    ).toEqual([{ id: "Omelette", score: 1, used: ["Œufs"] }]);
  });

  test("a product past its DDM counts normally", () => {
    expect(
      summarize(
        [item({ name: "Riz", dateKind: "DDM", expiresOn: inDays(-10) })],
        [recipe("Riz cantonais", "Riz")],
      ),
    ).toEqual([{ id: "Riz cantonais", score: 1, used: ["Riz"] }]);
  });
});

describe("suggestRecipes — selection", () => {
  test("returns the 5 best recipes, best first", () => {
    const stock = [
      item({ name: "A", expiresOn: inDays(1) }),
      item({ name: "B", expiresOn: inDays(4) }),
      item({ name: "C" }),
    ];
    const recipes = [
      recipe("R1", "C"),
      recipe("R2", "A", "B", "C"),
      recipe("R3", "B"),
      recipe("R4", "A", "B"),
      recipe("R5", "A"),
      recipe("R6", "B", "C"),
      recipe("R7", "Z"),
    ];
    expect(summarize(stock, recipes).map(({ id, score }) => [id, score])).toEqual([
      ["R2", 8],
      ["R4", 7],
      ["R5", 4],
      ["R6", 4],
      ["R3", 3],
    ]);
  });

  test("empty stock gives no suggestion", () => {
    expect(summarize([], [recipe("Omelette", "Œufs")])).toEqual([]);
  });

  test("no compatible recipe gives no suggestion", () => {
    expect(
      summarize([item({ name: "Lait" })], [recipe("Omelette", "Œufs"), recipe("Salade", "Laitue")]),
    ).toEqual([]);
  });

  test("an ingredient whose quantity is zero is not available", () => {
    expect(
      summarize(
        [item({ name: "Œufs", quantity: 0 }), item({ name: "Lait" })],
        [recipe("Crêpes", "Œufs", "Lait"), recipe("Omelette", "Œufs")],
      ),
    ).toEqual([{ id: "Crêpes", score: 1, used: ["Lait"] }]);
  });

  test.each(["consommé", "jeté"] as const)("a %s product is not available", (status) => {
    expect(
      summarize(
        [item({ name: "Œufs", status, closedOn: today }), item({ name: "Lait" })],
        [recipe("Crêpes", "Œufs", "Lait"), recipe("Omelette", "Œufs")],
      ),
    ).toEqual([{ id: "Crêpes", score: 1, used: ["Lait"] }]);
  });
});

describe("suggestRecipes — ties", () => {
  test("equal scores: the recipe with more urgent products comes first", () => {
    // Aïoli : 3 (B sous 4 j) + 1 (C) = 4, aucun produit urgent.
    // Zeste : 4 (A sous 1 j), un produit urgent.
    const stock = [
      item({ name: "A", expiresOn: inDays(1) }),
      item({ name: "B", expiresOn: inDays(4) }),
      item({ name: "C" }),
    ];
    expect(
      summarize(stock, [recipe("Aïoli", "B", "C"), recipe("Zeste", "A")]).map(
        ({ id, score }) => [id, score],
      ),
    ).toEqual([
      ["Zeste", 4],
      ["Aïoli", 4],
    ]);
  });

  test("equal scores and urgent products: alphabetical order of titles", () => {
    const stock = [item({ name: "Œufs" })];
    expect(
      summarize(stock, [
        recipe("Flan", "Œufs"),
        recipe("Omelette", "Œufs"),
        recipe("Éclair", "Œufs"),
        recipe("Crêpes", "Œufs"),
      ]).map(({ id }) => id),
    ).toEqual(["Crêpes", "Éclair", "Flan", "Omelette"]);
  });
});
