import js from "@eslint/js";
import prettier from "eslint-config-prettier/flat";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist", "coverage", "playwright-report", "test-results"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["*.config.{js,ts}", "e2e/**/*.ts", "build/**/*.ts"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["build/sw.template.js"],
    extends: [js.configs.recommended],
    languageOptions: { globals: { ...globals.serviceworker, __PRECACHE__: "readonly" } },
  },
  prettier,
]);
