import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const LOCALES = ["en", "es"] as const;
const UI_DATA_DIR = join(process.cwd(), "public", "ui-data", "v1");

function readIndexSlugs(resource: string, lang: string): string[] {
  const indexPath = join(UI_DATA_DIR, resource, lang, "_index.json");
  if (existsSync(indexPath)) {
    const raw = JSON.parse(readFileSync(indexPath, "utf-8")) as {
      entries?: Array<{ slug?: string; name?: string }>;
    };
    return (raw.entries ?? []).map((e) => e.slug ?? e.name ?? "").filter(Boolean);
  }
  // Fallback: some resources (e.g. pokemon-species, pokemon-form) don't
  // emit a list _index.json but do publish per-slug JSON files. Derive
  // the slug list from the directory contents so every detail page is
  // still prerendered.
  const dir = join(UI_DATA_DIR, resource, lang);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => f.slice(0, -".json".length));
}

/**
 * Resources with per-slug detail pages. The list path is the URL the
 * user lands on (may be the index route or the grouping page); the
 * detail prefix is where `<slug>` is appended. When the resource has
 * no list page we leave `list` as null.
 */
const DETAIL_RESOURCES: Array<{
  bundleDir: string;
  list: string | null;
  detailPrefix: string;
}> = [
  // Pokémon uses its own list route under /$lang/pokemon
  { bundleDir: "pokemon", list: "pokemon", detailPrefix: "pokemon" },
  { bundleDir: "type", list: "types", detailPrefix: "type" },
  { bundleDir: "ability", list: "abilities", detailPrefix: "ability" },
  { bundleDir: "pokemon-species", list: null, detailPrefix: "pokemon-species" },
  { bundleDir: "pokemon-form", list: null, detailPrefix: "pokemon-form" },
  { bundleDir: "berry", list: "berries", detailPrefix: "berry" },
  { bundleDir: "item", list: "items", detailPrefix: "item" },
  { bundleDir: "move", list: "moves", detailPrefix: "move" },
  { bundleDir: "generation", list: "generations", detailPrefix: "generation" },
];

/** Pages that exist only as lists (no per-slug detail). */
const LIST_ONLY: Array<{ bundleDir: string; path: string }> = [
  { bundleDir: "location", path: "locations" },
];

function buildPrerenderPages(): Array<{ path: string }> {
  const pages: Array<{ path: string }> = [{ path: "/" }];
  for (const lang of LOCALES) {
    pages.push({ path: `/${lang}` });

    for (const r of DETAIL_RESOURCES) {
      if (r.list) pages.push({ path: `/${lang}/${r.list}` });
      for (const slug of readIndexSlugs(r.bundleDir, lang)) {
        pages.push({ path: `/${lang}/${r.detailPrefix}/${slug}` });
      }
    }

    for (const r of LIST_ONLY) {
      // Only emit the list page when the bundle exists — prevents failed
      // prerenders when bundles haven't been built yet.
      const indexPath = join(UI_DATA_DIR, r.bundleDir, lang, "_index.json");
      if (existsSync(indexPath)) pages.push({ path: `/${lang}/${r.path}` });
    }

    // Search index page (client-side filtered). Prerender only when the
    // bundle exists so the initial render can hydrate from data.
    const searchIndexPath = join(UI_DATA_DIR, "search", lang, "_index.json");
    if (existsSync(searchIndexPath)) pages.push({ path: `/${lang}/search` });
  }
  return pages;
}

export default defineConfig({
  base: "/pokedex/",
  server: { port: 3000 },
  plugins: [
    tanstackStart({
      router: { basepath: "/pokedex" },
      pages: buildPrerenderPages().map((p) => ({ ...p, prerender: { crawlLinks: false } })),
      prerender: {
        enabled: true,
        concurrency: 8,
        failOnError: true,
      },
    }),
    viteReact(),
  ],
  resolve: {
    alias: {
      "~": join(process.cwd(), "src"),
    },
  },
});
