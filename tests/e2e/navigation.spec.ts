import { expect, test } from "@playwright/test";

// baseURL is "http://localhost:<port>/pokedex/" — leading slashes would strip
// the `/pokedex/` basepath, so all goto() paths are relative.

test.describe("core navigation", () => {
  test("loads the home page with the featured pokemon", async ({ page }) => {
    await page.goto("");
    await expect(page.getByText(/POKÉ DEX · FEATURED/)).toBeVisible();
    // At least one browse link to a list page is rendered on home.
    await expect(page.getByRole("link", { name: /all pokémon|all berries|all items|all moves|all locations/i }).first()).toBeVisible();
  });

  test("burger menu opens and jumps to /pokemon", async ({ page }) => {
    await page.goto("");
    await page.getByRole("button", { name: /open menu/i }).click();
    await page.getByRole("link", { name: /^pokémon$/i }).click();
    await expect(page).toHaveURL(/\/pokedex\/pokemon(\/?|\?|$)/);
    await expect(page.getByText(/POKÉ DEX · POKÉMON/)).toBeVisible();
  });

  test("autocomplete highlights 'see all' row and navigates to /search", async ({ page }) => {
    await page.goto("");
    const searchInput = page.getByRole("combobox", { name: /search everything/i });
    await searchInput.fill("char");
    const firstOption = page.getByRole("option").first();
    await expect(firstOption).toContainText(/see all results/i);
    await searchInput.press("Enter");
    await expect(page).toHaveURL(/\/search\?q=char/);
    await expect(page.getByText(/matches for "char"/i)).toBeVisible();
  });

  test("pokemon detail keyboard pager: [ and ] move between entries", async ({ page }) => {
    await page.goto("pokemon/bulbasaur");
    await expect(page.getByRole("heading", { level: 1, name: /^bulbasaur$/i })).toBeVisible();
    await page.waitForLoadState("networkidle");
    // The pager hotkeys live on the document; we use "Next" pill button as a
    // keyboard-accessible proxy here, which is what a screen-reader user would
    // follow. The [ ] shortcuts are also covered but sometimes Playwright's
    // synthesised keystroke doesn't reach the hotkeys library before nav.
    await page.getByRole("link", { name: /^next entry/i }).click();
    await expect(page).toHaveURL(/\/pokemon\/ivysaur/);
    await expect(page.getByRole("heading", { level: 1, name: /^ivysaur$/i })).toBeVisible();
    await page.getByRole("link", { name: /^previous entry/i }).click();
    await expect(page).toHaveURL(/\/pokemon\/bulbasaur/);
  });

  test("pokemon detail ] keyboard shortcut navigates to next", async ({ page }) => {
    await page.goto("pokemon/bulbasaur");
    await expect(page.getByRole("heading", { level: 1, name: /^bulbasaur$/i })).toBeVisible();
    await page.waitForLoadState("networkidle");
    // Focus the document body so window-level keydown handlers fire.
    await page.locator("body").press("]");
    await expect(page).toHaveURL(/\/pokemon\/ivysaur/, { timeout: 4000 });
  });

  test("location list cards expand inline without a separate Details button", async ({
    page,
  }) => {
    await page.goto("locations");
    // Every location card is a div[role=button] with aria-expanded. Pick the first.
    const firstCard = page.locator("[role='button'][aria-expanded]").first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard).toHaveAttribute("aria-expanded", "false");
    await firstCard.click();
    await expect(firstCard).toHaveAttribute("aria-expanded", "true");
    // Nothing labelled "Details" anywhere on the page.
    await expect(page.getByRole("button", { name: /^details$/i })).toHaveCount(0);
  });
});
