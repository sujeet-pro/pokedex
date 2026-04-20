import { test, expect } from "@playwright/test";

test("root landing shows language picker", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "Pokédex" })).toBeVisible();
  await expect(page.getByRole("link", { name: "English" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Français" })).toBeVisible();
});

test("English home is reachable", async ({ page }) => {
  await page.goto("./en/");
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Pokémon" }).first()).toBeVisible();
});

test("Pokemon list renders", async ({ page }) => {
  await page.goto("./en/pokemon/");
  await expect(page.getByRole("heading", { name: "All Pokémon" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Bulbasaur/i })).toBeVisible();
});

test("Pokemon detail — Bulbasaur (EN)", async ({ page }) => {
  await page.goto("./en/pokemon/bulbasaur/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/bulbasaur/i);
  await expect(page.locator(".stat-row")).toHaveCount(6);
});

test("Pokemon detail — Bulbizarre (FR)", async ({ page }) => {
  await page.goto("./fr/pokemon/bulbasaur/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/bulbizarre/i);
  await expect(page.getByText("Pokémon Graine")).toBeVisible();
});
