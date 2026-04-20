#!/usr/bin/env tsx
import { join } from "node:path";
import { existsSync } from "node:fs";
import { writeJson } from "./lib/io";
import { readPokemonIndex, readResourceIndex, refId, DATA_ROOT } from "./lib/pokeapi";
import { buildPokemonBundle, type BuildContext } from "./lib/transform-pokemon";
import { buildTypeBundle } from "./lib/transform-type";
import { buildAbilityBundle } from "./lib/transform-ability";
import { buildBerryBundle } from "./lib/transform-berry";
import { buildItemBundle } from "./lib/transform-item";
import { buildMoveBundle } from "./lib/transform-move";
import { buildLocationIndexEntry } from "./lib/transform-location";
import { buildGenerationBundle } from "./lib/transform-generation";
import { buildSpeciesBundle } from "./lib/transform-species";
import { buildFormBundle } from "./lib/transform-form";
import { makeSearchEntry } from "./lib/transform-search";
import type {
  PokemonIndexBundle,
  TypeIndexBundle,
  AbilityIndexBundle,
  BerryIndexBundle,
  ItemIndexBundle,
  MoveIndexBundle,
  LocationIndexBundle,
  GenerationIndexBundle,
  SearchIndexBundle,
  SearchIndexEntry,
} from "../src/types/bundles";
import { LOCALES, type Locale } from "../src/types/locales";

const OUT_ROOT = join(process.cwd(), "public", "ui-data", "v1");

function pokemonResourceExists(id: number): boolean {
  const p = join(DATA_ROOT, "pokemon", String(id), "index.json");
  const s = join(DATA_ROOT, "pokemon-species", String(id), "index.json");
  return existsSync(p) && existsSync(s);
}

function resourceExists(resource: string, id: number): boolean {
  return existsSync(join(DATA_ROOT, resource, String(id), "index.json"));
}

function pokemonContext(): BuildContext {
  const index = readPokemonIndex();
  const ids: number[] = [];
  for (const ref of index.results) {
    const id = refId(ref);
    if (pokemonResourceExists(id)) ids.push(id);
  }
  ids.sort((a, b) => a - b);
  return { displayNames: new Map(), orderedIds: ids };
}

function collectResourceIds(resource: string): number[] {
  const index = readResourceIndex(resource);
  const ids: number[] = [];
  for (const ref of index.results) {
    const id = refId(ref);
    if (resourceExists(resource, id)) ids.push(id);
  }
  ids.sort((a, b) => a - b);
  return ids;
}

// ---------- Pokemon ----------

async function buildPokemon(
  lang: Locale,
  ctx: BuildContext,
  search: SearchIndexEntry[],
): Promise<number> {
  const outDir = join(OUT_ROOT, "pokemon", lang);
  const indexEntries = [];
  let count = 0;
  for (const id of ctx.orderedIds) {
    const { bundle, indexEntry } = buildPokemonBundle(id, lang, ctx);
    writeJson(join(outDir, `${bundle.name}.json`), bundle);
    indexEntries.push(indexEntry);
    // Search: tag with primary type
    const primaryType = bundle.types[0]?.name ?? undefined;
    search.push(
      makeSearchEntry("pokemon", bundle.id, bundle.name, bundle.display_name, primaryType),
    );
    count++;
    if (count % 100 === 0) {
      process.stdout.write(`[${lang}] pokemon ${count}/${ctx.orderedIds.length}\n`);
    }
  }
  const indexBundle: PokemonIndexBundle = {
    kind: "pokemon-index",
    locale: lang,
    total: indexEntries.length,
    entries: indexEntries,
  };
  writeJson(join(outDir, "_index.json"), indexBundle);
  return count;
}

// ---------- Species ----------

async function buildSpeciesList(lang: Locale, ids: number[]): Promise<number> {
  const outDir = join(OUT_ROOT, "pokemon-species", lang);
  let count = 0;
  for (const id of ids) {
    const bundle = buildSpeciesBundle(id, lang);
    if (!bundle) continue;
    writeJson(join(outDir, `${bundle.name}.json`), bundle);
    count++;
    if (count % 100 === 0) {
      process.stdout.write(`[${lang}] species ${count}/${ids.length}\n`);
    }
  }
  return count;
}

// ---------- Forms ----------

async function buildForms(lang: Locale, ids: number[]): Promise<number> {
  const outDir = join(OUT_ROOT, "pokemon-form", lang);
  let count = 0;
  for (const id of ids) {
    const bundle = buildFormBundle(id, lang);
    if (!bundle) continue;
    writeJson(join(outDir, `${bundle.name}.json`), bundle);
    count++;
    if (count % 100 === 0) {
      process.stdout.write(`[${lang}] forms ${count}/${ids.length}\n`);
    }
  }
  return count;
}

// ---------- Types ----------

async function buildTypes(
  lang: Locale,
  ids: number[],
  search: SearchIndexEntry[],
): Promise<number> {
  const outDir = join(OUT_ROOT, "type", lang);
  const indexEntries = [];
  let count = 0;
  for (const id of ids) {
    const out = buildTypeBundle(id, lang);
    if (!out) continue;
    writeJson(join(outDir, `${out.bundle.name}.json`), out.bundle);
    indexEntries.push(out.indexEntry);
    search.push(
      makeSearchEntry(
        "type",
        out.bundle.id,
        out.bundle.name,
        out.bundle.display_name,
        out.bundle.generation,
      ),
    );
    count++;
    if (count % 100 === 0) {
      process.stdout.write(`[${lang}] type ${count}/${ids.length}\n`);
    }
  }
  const indexBundle: TypeIndexBundle = {
    kind: "type-index",
    locale: lang,
    total: indexEntries.length,
    entries: indexEntries,
  };
  writeJson(join(outDir, "_index.json"), indexBundle);
  return count;
}

// ---------- Abilities ----------

async function buildAbilities(
  lang: Locale,
  ids: number[],
  search: SearchIndexEntry[],
): Promise<number> {
  const outDir = join(OUT_ROOT, "ability", lang);
  const indexEntries = [];
  let count = 0;
  for (const id of ids) {
    const out = buildAbilityBundle(id, lang);
    if (!out) continue;
    writeJson(join(outDir, `${out.bundle.name}.json`), out.bundle);
    indexEntries.push(out.indexEntry);
    search.push(
      makeSearchEntry(
        "ability",
        out.bundle.id,
        out.bundle.name,
        out.bundle.display_name,
      ),
    );
    count++;
    if (count % 100 === 0) {
      process.stdout.write(`[${lang}] ability ${count}/${ids.length}\n`);
    }
  }
  const indexBundle: AbilityIndexBundle = {
    kind: "ability-index",
    locale: lang,
    total: indexEntries.length,
    entries: indexEntries,
  };
  writeJson(join(outDir, "_index.json"), indexBundle);
  return count;
}

// ---------- Berries ----------

async function buildBerries(
  lang: Locale,
  ids: number[],
  search: SearchIndexEntry[],
): Promise<number> {
  const outDir = join(OUT_ROOT, "berry", lang);
  const indexEntries = [];
  let count = 0;
  for (const id of ids) {
    const out = buildBerryBundle(id, lang);
    if (!out) continue;
    writeJson(join(outDir, `${out.bundle.name}.json`), out.bundle);
    indexEntries.push(out.indexEntry);
    search.push(
      makeSearchEntry(
        "berry",
        out.bundle.id,
        out.bundle.name,
        out.bundle.display_name,
        out.bundle.firmness,
      ),
    );
    count++;
    if (count % 100 === 0) {
      process.stdout.write(`[${lang}] berry ${count}/${ids.length}\n`);
    }
  }
  const indexBundle: BerryIndexBundle = {
    kind: "berry-index",
    locale: lang,
    total: indexEntries.length,
    entries: indexEntries,
  };
  writeJson(join(outDir, "_index.json"), indexBundle);
  return count;
}

// ---------- Items ----------

async function buildItems(
  lang: Locale,
  ids: number[],
  search: SearchIndexEntry[],
): Promise<number> {
  const outDir = join(OUT_ROOT, "item", lang);
  const indexEntries = [];
  let count = 0;
  for (const id of ids) {
    const out = buildItemBundle(id, lang);
    if (!out) continue;
    writeJson(join(outDir, `${out.bundle.name}.json`), out.bundle);
    indexEntries.push(out.indexEntry);
    search.push(
      makeSearchEntry(
        "item",
        out.bundle.id,
        out.bundle.name,
        out.bundle.display_name,
        out.bundle.category,
      ),
    );
    count++;
    if (count % 100 === 0) {
      process.stdout.write(`[${lang}] item ${count}/${ids.length}\n`);
    }
  }
  const indexBundle: ItemIndexBundle = {
    kind: "item-index",
    locale: lang,
    total: indexEntries.length,
    entries: indexEntries,
  };
  writeJson(join(outDir, "_index.json"), indexBundle);
  return count;
}

// ---------- Moves ----------

async function buildMoves(
  lang: Locale,
  ids: number[],
  search: SearchIndexEntry[],
): Promise<number> {
  const outDir = join(OUT_ROOT, "move", lang);
  const indexEntries = [];
  let count = 0;
  for (const id of ids) {
    const out = buildMoveBundle(id, lang);
    if (!out) continue;
    writeJson(join(outDir, `${out.bundle.name}.json`), out.bundle);
    indexEntries.push(out.indexEntry);
    search.push(
      makeSearchEntry(
        "move",
        out.bundle.id,
        out.bundle.name,
        out.bundle.display_name,
        out.bundle.type,
      ),
    );
    count++;
    if (count % 100 === 0) {
      process.stdout.write(`[${lang}] move ${count}/${ids.length}\n`);
    }
  }
  const indexBundle: MoveIndexBundle = {
    kind: "move-index",
    locale: lang,
    total: indexEntries.length,
    entries: indexEntries,
  };
  writeJson(join(outDir, "_index.json"), indexBundle);
  return count;
}

// ---------- Locations (index only) ----------

async function buildLocations(
  lang: Locale,
  ids: number[],
  search: SearchIndexEntry[],
): Promise<number> {
  const outDir = join(OUT_ROOT, "location", lang);
  const indexEntries = [];
  let count = 0;
  for (const id of ids) {
    const entry = buildLocationIndexEntry(id, lang);
    if (!entry) continue;
    indexEntries.push(entry);
    search.push(
      makeSearchEntry("location", entry.id, entry.name, entry.display_name, entry.region),
    );
    count++;
    if (count % 100 === 0) {
      process.stdout.write(`[${lang}] location ${count}/${ids.length}\n`);
    }
  }
  const indexBundle: LocationIndexBundle = {
    kind: "location-index",
    locale: lang,
    total: indexEntries.length,
    entries: indexEntries,
  };
  writeJson(join(outDir, "_index.json"), indexBundle);
  return count;
}

// ---------- Generations ----------

async function buildGenerations(
  lang: Locale,
  ids: number[],
  search: SearchIndexEntry[],
): Promise<number> {
  const outDir = join(OUT_ROOT, "generation", lang);
  const indexEntries = [];
  let count = 0;
  for (const id of ids) {
    const out = buildGenerationBundle(id, lang);
    if (!out) continue;
    writeJson(join(outDir, `${out.bundle.name}.json`), out.bundle);
    indexEntries.push(out.indexEntry);
    search.push(
      makeSearchEntry(
        "generation",
        out.bundle.id,
        out.bundle.name,
        out.bundle.display_name,
        out.bundle.main_region,
      ),
    );
    count++;
    if (count % 100 === 0) {
      process.stdout.write(`[${lang}] generation ${count}/${ids.length}\n`);
    }
  }
  const indexBundle: GenerationIndexBundle = {
    kind: "generation-index",
    locale: lang,
    total: indexEntries.length,
    entries: indexEntries,
  };
  writeJson(join(outDir, "_index.json"), indexBundle);
  return count;
}

// ---------- Search ----------

async function buildSearch(lang: Locale, entries: SearchIndexEntry[]): Promise<number> {
  const bundle: SearchIndexBundle = {
    kind: "search-index",
    locale: lang,
    total: entries.length,
    entries,
  };
  writeJson(join(OUT_ROOT, "search", lang, "_index.json"), bundle);
  return entries.length;
}

// ---------- Main ----------

type Counts = {
  pokemon: number;
  species: number;
  forms: number;
  type: number;
  ability: number;
  berry: number;
  item: number;
  move: number;
  location: number;
  generation: number;
  search: number;
};

async function buildForLocale(
  lang: Locale,
  ctx: BuildContext,
  ids: {
    types: number[];
    abilities: number[];
    berries: number[];
    items: number[];
    moves: number[];
    locations: number[];
    generations: number[];
    species: number[];
    forms: number[];
  },
): Promise<Counts> {
  process.stdout.write(`\n=== Building locale: ${lang} ===\n`);
  const search: SearchIndexEntry[] = [];

  const counts: Counts = {
    pokemon: 0,
    species: 0,
    forms: 0,
    type: 0,
    ability: 0,
    berry: 0,
    item: 0,
    move: 0,
    location: 0,
    generation: 0,
    search: 0,
  };

  counts.pokemon = await buildPokemon(lang, ctx, search);
  process.stdout.write(`[${lang}] pokemon: ${counts.pokemon}\n`);

  counts.species = await buildSpeciesList(lang, ids.species);
  process.stdout.write(`[${lang}] species: ${counts.species}\n`);

  counts.forms = await buildForms(lang, ids.forms);
  process.stdout.write(`[${lang}] forms: ${counts.forms}\n`);

  counts.type = await buildTypes(lang, ids.types, search);
  process.stdout.write(`[${lang}] types: ${counts.type}\n`);

  counts.ability = await buildAbilities(lang, ids.abilities, search);
  process.stdout.write(`[${lang}] abilities: ${counts.ability}\n`);

  counts.berry = await buildBerries(lang, ids.berries, search);
  process.stdout.write(`[${lang}] berries: ${counts.berry}\n`);

  counts.item = await buildItems(lang, ids.items, search);
  process.stdout.write(`[${lang}] items: ${counts.item}\n`);

  counts.move = await buildMoves(lang, ids.moves, search);
  process.stdout.write(`[${lang}] moves: ${counts.move}\n`);

  counts.location = await buildLocations(lang, ids.locations, search);
  process.stdout.write(`[${lang}] locations: ${counts.location}\n`);

  counts.generation = await buildGenerations(lang, ids.generations, search);
  process.stdout.write(`[${lang}] generations: ${counts.generation}\n`);

  counts.search = await buildSearch(lang, search);
  process.stdout.write(`[${lang}] search entries: ${counts.search}\n`);

  return counts;
}

async function main(): Promise<void> {
  const startedAt = Date.now();
  const ctx = pokemonContext();
  process.stdout.write(`Pokemon to build: ${ctx.orderedIds.length}\n`);

  const ids = {
    types: collectResourceIds("type"),
    abilities: collectResourceIds("ability"),
    berries: collectResourceIds("berry"),
    items: collectResourceIds("item"),
    moves: collectResourceIds("move"),
    locations: collectResourceIds("location"),
    generations: collectResourceIds("generation"),
    species: collectResourceIds("pokemon-species"),
    forms: collectResourceIds("pokemon-form"),
  };

  process.stdout.write(
    `Resources — types:${ids.types.length} abilities:${ids.abilities.length} berries:${ids.berries.length} items:${ids.items.length} moves:${ids.moves.length} locations:${ids.locations.length} generations:${ids.generations.length} species:${ids.species.length} forms:${ids.forms.length}\n`,
  );

  for (const lang of LOCALES) {
    await buildForLocale(lang, ctx, ids);
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  process.stdout.write(`\nDone in ${elapsed}s.\n`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
