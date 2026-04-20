#!/usr/bin/env tsx
import { join } from "node:path";
import { existsSync } from "node:fs";
import { writeJson } from "./lib/io";
import { readPokemonIndex, refId, DATA_ROOT } from "./lib/pokeapi";
import { buildPokemonBundle, type BuildContext } from "./lib/transform-pokemon";
import type { PokemonIndexBundle } from "../src/types/bundles";
import { LOCALES, type Locale } from "../src/types/locales";

const OUT_ROOT = join(process.cwd(), "public", "ui-data", "v1");

function pokemonResourceExists(id: number): boolean {
  const p = join(DATA_ROOT, "pokemon", String(id), "index.json");
  const s = join(DATA_ROOT, "pokemon-species", String(id), "index.json");
  return existsSync(p) && existsSync(s);
}

function buildContext(): BuildContext {
  const index = readPokemonIndex();
  const ids: number[] = [];
  for (const ref of index.results) {
    const id = refId(ref);
    if (pokemonResourceExists(id)) ids.push(id);
  }
  ids.sort((a, b) => a - b);
  return { displayNames: new Map(), orderedIds: ids };
}

async function buildForLocale(lang: Locale, ctx: BuildContext): Promise<void> {
  const outDir = join(OUT_ROOT, "pokemon", lang);
  const indexEntries = [];
  let count = 0;
  for (const id of ctx.orderedIds) {
    const { bundle, indexEntry } = buildPokemonBundle(id, lang, ctx);
    writeJson(join(outDir, `${bundle.name}.json`), bundle);
    indexEntries.push(indexEntry);
    count++;
    if (count % 100 === 0) process.stdout.write(`[${lang}] ${count}/${ctx.orderedIds.length}\n`);
  }
  const indexBundle: PokemonIndexBundle = {
    kind: "pokemon-index",
    locale: lang,
    total: indexEntries.length,
    entries: indexEntries,
  };
  writeJson(join(outDir, "_index.json"), indexBundle);
  process.stdout.write(`[${lang}] ${count} pokemon → ${outDir}\n`);
}

async function main(): Promise<void> {
  const ctx = buildContext();
  process.stdout.write(`Pokemon to build: ${ctx.orderedIds.length}\n`);
  for (const lang of LOCALES) {
    await buildForLocale(lang, ctx);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
