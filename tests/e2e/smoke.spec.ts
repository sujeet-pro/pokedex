import { test, expect } from "@playwright/test";

test("root landing shows language picker", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "Pokédex" })).toBeVisible();
  await expect(page.getByRole("link", { name: "English" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Français" })).toBeVisible();
});

test("English home shows featured pokemon + browse button", async ({ page }) => {
  await page.goto("./en");
  await expect(page.getByRole("link", { name: "Pokédex" }).first()).toBeVisible();
  await expect(page.locator(".hud-name").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Browse" })).toBeVisible();
});

test("Pokemon list has filter bar", async ({ page }) => {
  await page.goto("./en/pokemon");
  await expect(page.locator(".filter-bar")).toBeVisible();
  await expect(page.getByRole("button", { name: /Types/i })).toBeVisible();
});

test("Types landing is reachable", async ({ page }) => {
  await page.goto("./en/types");
  await expect(page.locator(".filter-bar")).toBeVisible();
});

test("Abilities landing is reachable", async ({ page }) => {
  await page.goto("./en/abilities");
  await expect(page.locator(".filter-bar")).toBeVisible();
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
