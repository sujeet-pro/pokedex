import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

type Theme = "red" | "blue" | "yellow";
type Mode = "light" | "dark";

const COMBOS: Array<{ theme: Theme; mode: Mode }> = [
  { theme: "red", mode: "dark" },
  { theme: "red", mode: "light" },
  { theme: "blue", mode: "dark" },
  { theme: "blue", mode: "light" },
  { theme: "yellow", mode: "dark" },
  { theme: "yellow", mode: "light" },
];

// Representative pages covering every page-level layout / card shape.
// Paths are relative to baseURL (leading "/" would strip the /pokedex/ prefix).
const PAGES: Array<{ label: string; path: string }> = [
  { label: "home", path: "" },
  { label: "pokemon list", path: "pokemon" },
  { label: "pokemon detail", path: "pokemon/bulbasaur" },
  { label: "berry list", path: "berries" },
  { label: "item list", path: "items" },
  { label: "location list", path: "locations" },
  { label: "move list", path: "moves" },
  { label: "generations", path: "generations" },
  { label: "search results", path: "search?q=char" },
];

async function setTheme(page: import("@playwright/test").Page, theme: Theme, mode: Mode) {
  await page.addInitScript(
    ({ theme, mode }) => {
      const prefs = { theme, mode, scale: "md", dir: "ltr", voice: null };
      localStorage.setItem("pokedex.prefs", JSON.stringify(prefs));
    },
    { theme, mode },
  );
}

for (const combo of COMBOS) {
  test.describe(`axe · ${combo.theme}/${combo.mode}`, () => {
    test.beforeEach(async ({ page }) => {
      await setTheme(page, combo.theme, combo.mode);
    });
    for (const pg of PAGES) {
      test(pg.label, async ({ page }) => {
        await page.goto(pg.path);
        // Let client-side Suspense resolve before axe scans.
        await page.waitForLoadState("networkidle");
        // Also wait for at least one card/link inside main content so the
        // list grids have rendered.
        await page
          .locator("main a, main h1, main h2, main h3, main [role='button']")
          .first()
          .waitFor({ state: "attached", timeout: 10_000 });
        const results = await new AxeBuilder({ page })
          // region = landmark rule; we have region/main + custom regions so
          // axe flags nested regions — acceptable for this retro console UI.
          .disableRules(["region"])
          .analyze();
        expect.soft(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
      });
    }
  });
}
