import { expect, test } from "vitest";
import { parsePackageQuantity } from "../src/domain/quantity.ts";

test.each([
  ["400 g ℮", { quantity: 400, unit: "g" }],
  ["400g", { quantity: 400, unit: "g" }],
  ["1 kg", { quantity: 1, unit: "kg" }],
  ["50 cl", { quantity: 500, unit: "ml" }],
  ["33 cL", { quantity: 330, unit: "ml" }],
  ["1,5 L", { quantity: 1.5, unit: "l" }],
  ["250 ml e", { quantity: 250, unit: "ml" }],
  ["6 x 125 g", { quantity: 750, unit: "g" }],
  ["2 × 1 L", { quantity: 2, unit: "l" }],
])("analyse la contenance « %s »", (text, expected) => {
  expect(parsePackageQuantity(text)).toEqual(expected);
});

test.each(["", "   ", "environ 300 g", "1 boîte", "0 g", "abc", "400 oz"])(
  "ne déduit aucune contenance de « %s »",
  (text) => {
    expect(parsePackageQuantity(text)).toBeUndefined();
  },
);
