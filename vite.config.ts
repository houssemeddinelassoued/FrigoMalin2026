import preact from "@preact/preset-vite";
import { defineConfig } from "vitest/config";
import { serviceWorker } from "./build/service-worker.ts";

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages sert le projet sous /FrigoMalin2026/ (ADR 0002, ADR 0003).
  base: "/FrigoMalin2026/",
  plugins: [preact(), serviceWorker(["favicon.svg"])],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/setup.ts"],
  },
});
