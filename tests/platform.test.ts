import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { polyfillWasmVersion } from "../src/components/BarcodeScanner.tsx";
import { resolveTheme } from "../src/theme.ts";

test("follows the system theme unless the user picked one", () => {
  expect(resolveTheme("system", true)).toBe("dark");
  expect(resolveTheme("system", false)).toBe("light");
  expect(resolveTheme("light", true)).toBe("light");
  expect(resolveTheme("dark", false)).toBe("dark");
});

test("serves the same zxing-wasm binary version as the barcode polyfill expects", async () => {
  // Vitest s'exécute depuis la racine du projet.
  const installed = JSON.parse(
    readFileSync("node_modules/zxing-wasm/package.json", "utf8"),
  ).version;
  expect(await polyfillWasmVersion()).toBe(installed);
});
