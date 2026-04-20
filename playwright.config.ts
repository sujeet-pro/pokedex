import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4173);
const basePath = "/pokedex/";

export default defineConfig({
  testDir: "./tests/e2e",
  // Keep runs deterministic: no retries locally, 2 retries in CI.
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${port}${basePath}`,
    trace: "on-first-retry",
  },
  // Spin up `vite preview` on demand. Reuse if already running locally.
  webServer: {
    command: `npm run preview -- --port ${port}`,
    url: `http://localhost:${port}${basePath}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
