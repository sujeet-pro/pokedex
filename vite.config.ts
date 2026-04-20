import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const LOCALES = ["en", "fr"] as const;
const UI_DATA_DIR = join(process.cwd(), "public", "ui-data", "v1");

function readIndexSlugs(resource: string, lang: string): string[] {
  const indexPath = join(UI_DATA_DIR, resource, lang, "_index.json");
  if (!existsSync(indexPath)) return [];
  const raw = JSON.parse(readFileSync(indexPath, "utf-8")) as {
    entries?: Array<{ name: string }>;
  };
  return (raw.entries ?? []).map((e) => e.name);
}

function buildPrerenderPages(): Array<{ path: string }> {
  const pages: Array<{ path: string }> = [{ path: "/" }];
  for (const lang of LOCALES) {
    pages.push({ path: `/${lang}` });
    pages.push({ path: `/${lang}/pokemon` });
    for (const slug of readIndexSlugs("pokemon", lang)) {
      pages.push({ path: `/${lang}/pokemon/${slug}` });
    }
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
