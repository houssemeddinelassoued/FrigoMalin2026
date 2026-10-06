import { defineConfig, devices } from "@playwright/test";

const port = 4173;

export default defineConfig({
  testDir: ".",
  testMatch: ["e2e/**/*.spec.ts", "tests/e2e/**/*.spec.ts"],
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  reporter: "html",
  use: {
    // Le build est servi sous le même préfixe que sur GitHub Pages.
    baseURL: `http://localhost:${port}/FrigoMalin2026/`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npm run preview -- --port ${port} --strictPort`,
    url: `http://localhost:${port}/FrigoMalin2026/`,
    reuseExistingServer: !process.env["CI"],
  },
});
