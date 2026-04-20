// Parses src/styles/global.css and checks that every (theme × mode) palette
// clears WCAG 2.2 AA contrast ratios for the text/background combinations the
// app actually paints. If a CSS change regresses contrast, this test screams.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const CSS_PATH = resolve(process.cwd(), "src/styles/global.css");

const THEMES = ["red", "blue", "yellow"] as const;
const MODES = ["dark", "light"] as const;

type Rgb = [number, number, number];

function hexToRgb(hex: string): Rgb {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance([r, g, b]: Rgb): number {
  const srgb = [r, g, b].map((v) => v / 255);
  const lin = srgb.map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4),
  );
  return 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!;
}

function contrastRatio(a: Rgb, b: Rgb): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

type Palette = Record<string, string>;

function parsePalettes(css: string): Map<string, Palette> {
  // Match blocks like:
  //   :root[data-theme="red"][data-mode="dark"] { ...vars... }
  const blockRe =
    /:root\[data-theme="([^"]+)"\]\[data-mode="([^"]+)"\]\s*\{([^}]+)\}/g;
  const varRe = /--([a-z0-9-]+)\s*:\s*(#[0-9a-f]{3,8})\s*;/gi;
  const out = new Map<string, Palette>();
  for (const match of css.matchAll(blockRe)) {
    const theme = match[1]!;
    const mode = match[2]!;
    const body = match[3]!;
    const pal: Palette = {};
    for (const v of body.matchAll(varRe)) {
      pal[v[1]!] = v[2]!;
    }
    out.set(`${theme}:${mode}`, pal);
  }
  return out;
}

const css = readFileSync(CSS_PATH, "utf-8");
const palettes = parsePalettes(css);

// Text combos we actually render, and the minimum contrast each must clear.
// 4.5 = WCAG 2.2 AA for body text. 3 = AA for large (18pt+) text / graphics.
const COMBOS: Array<{
  label: string;
  fg: string;
  bg: string;
  min: number;
}> = [
  { label: "page body text on page bg", fg: "text", bg: "bg", min: 4.5 },
  { label: "page muted text on page bg", fg: "text-muted", bg: "bg", min: 4.5 },
  { label: "screen fg on screen bg", fg: "screen-fg", bg: "screen-bg", min: 4.5 },
  { label: "screen dim fg on screen bg", fg: "screen-fg-dim", bg: "screen-bg", min: 4.5 },
  { label: "phosphor on screen bg", fg: "phosphor", bg: "screen-bg", min: 4.5 },
  { label: "phosphor-dim on screen bg (labels)", fg: "phosphor-dim", bg: "screen-bg", min: 4.5 },
  { label: "amber on screen bg", fg: "amber", bg: "screen-bg", min: 4.5 },
];

describe("WCAG 2.2 AA palette contrast", () => {
  it("parses every theme × mode palette", () => {
    for (const theme of THEMES) {
      for (const mode of MODES) {
        expect(palettes.get(`${theme}:${mode}`), `${theme}:${mode} palette missing`).toBeDefined();
      }
    }
  });

  for (const theme of THEMES) {
    for (const mode of MODES) {
      const key = `${theme}:${mode}`;
      describe(key, () => {
        const pal = palettes.get(key)!;
        for (const combo of COMBOS) {
          it(`${combo.label} ≥ ${combo.min}:1`, () => {
            const fg = pal[combo.fg];
            const bg = pal[combo.bg];
            expect(fg, `${key} ${combo.fg}`).toBeDefined();
            expect(bg, `${key} ${combo.bg}`).toBeDefined();
            const ratio = contrastRatio(hexToRgb(fg!), hexToRgb(bg!));
            expect(
              ratio,
              `${key}: ${combo.fg} (${fg}) on ${combo.bg} (${bg}) = ${ratio.toFixed(2)}:1`,
            ).toBeGreaterThanOrEqual(combo.min);
          });
        }
      });
    }
  }
});
