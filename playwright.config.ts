import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env["CI"]),
  retries: process.env["CI"] ? 2 : 0,
  workers: process.env["CI"] ? 1 : undefined,
  reporter: process.env["CI"] ? "line" : "list",
  use: {
    baseURL: "http://localhost:4173/pokedex/",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npx vite preview --port 4173",
    url: "http://localhost:4173/pokedex/",
    reuseExistingServer: !process.env["CI"],
    timeout: 60_000,
    stdout: "pipe",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
