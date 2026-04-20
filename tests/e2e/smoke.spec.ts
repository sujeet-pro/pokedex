import { test, expect } from "@playwright/test";

test("root landing shows language picker", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "Pokédex" })).toBeVisible();
  await expect(page.getByRole("link", { name: "English" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Français" })).toBeVisible();
});

test("English home is reachable", async ({ page }) => {
  await page.goto("./en");
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Pokémon" }).first()).toBeVisible();
});

test("Pokemon list renders", async ({ page }) => {
  await page.goto("./en/pokemon");
  await expect(page.getByRole("heading", { level: 1, name: "All Pokémon" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Bulbasaur/i })).toBeVisible();
});

test("Pokemon detail — Bulbasaur (EN) renders widgets", async ({ page }) => {
  await page.goto("./en/pokemon/bulbasaur");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/bulbasaur/i);
  await expect(page.locator(".radar__svg")).toBeVisible();
  await expect(page.locator(".weak__cell")).toHaveCount(18);
  await expect(page.locator(".ability-btn")).toHaveCount(2);
});

test("Pokemon detail — FR uses localized slug", async ({ page }) => {
  await page.goto("./fr/pokemon/bulbizarre");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/bulbizarre/i);
  await expect(page.getByText("Pokémon Graine")).toBeVisible();
});

test("Type detail — EN fire + FR feu", async ({ page }) => {
  await page.goto("./en/type/fire");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/fire/i);
  await page.goto("./fr/type/feu");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/feu/i);
});

test("Ability detail — EN blaze + FR brasier", async ({ page }) => {
  await page.goto("./en/ability/blaze");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/blaze/i);
  await page.goto("./fr/ability/brasier");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/brasier/i);
});

test("Search page renders input", async ({ page }) => {
  await page.goto("./en/search");
  await expect(page.getByRole("searchbox")).toBeVisible();
});
