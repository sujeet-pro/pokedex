// Read data/ (raw PokéAPI mirror) and write public/bundles/<resource>/<name>.json —
// one file per detail page, one fetch per navigation. Also writes per-resource
// _index.json for list pages and a unified bundles/search-index.json for the
// global search bar.
//
// Run with `npm run bundles:build`. Fast enough to run on every `npm run build`.

import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { OUT_ROOT, ROOT, writeBundle } from "./lib/io.ts";
import {
  buildAbilityBundles,
  buildFormBundles,
  buildSpeciesBundles,
  buildTypeBundles,
} from "./lib/transform/basic.ts";
import {
  buildBerryBundles,
  buildGenerationBundles,
  buildItemBundles,
  buildLocationBundles,
  buildMoveBundles,
} from "./lib/transform/extra.ts";
import { buildPokemonBundle, buildPokemonIndex } from "./lib/transform/pokemon.ts";
import type { SearchEntry, SearchIndexBundle } from "~/types/bundles";

const SUMMARIES_SRC = resolve(ROOT, "data_generated/summary");
const SUMMARIES_OUT = resolve(OUT_ROOT, "summary");

function copySummaries() {
  if (!existsSync(SUMMARIES_SRC)) return;
  mkdirSync(SUMMARIES_OUT, { recursive: true });
  for (const file of readdirSync(SUMMARIES_SRC)) {
    if (!file.endsWith(".txt")) continue;
    copyFileSync(resolve(SUMMARIES_SRC, file), resolve(SUMMARIES_OUT, file));
  }
}

async function main() {
  console.log("Clearing previous bundles…");
  rmSync(OUT_ROOT, { recursive: true, force: true });
  mkdirSync(OUT_ROOT, { recursive: true });

  const search: SearchEntry[] = [];

  // ── Pokemon ─────────────────────────────────────────────────────────
  console.log("Building pokemon index…");
  const pokemonIndex = buildPokemonIndex();
  writeBundle("pokemon/_index.json", pokemonIndex);
  console.log(`  ${pokemonIndex.entries.length} entries indexed.`);

  console.log("Building pokemon bundles…");
  const entries = pokemonIndex.entries;
  let count = 0;
  const startedAt = Date.now();
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;
    const bundle = buildPokemonBundle(entry, {
      prev: entries[i - 1] ?? null,
      next: entries[i + 1] ?? null,
    });
    writeBundle(`pokemon/${entry.name}.json`, bundle);
    count++;
    if (count % 100 === 0) console.log(`  ${count}/${entries.length}`);
  }
  console.log(`  ${count} pokemon bundles in ${Date.now() - startedAt}ms.`);
  for (const e of entries) {
    search.push({
      kind: "pokemon",
      name: e.name,
      id: e.id,
      display_name: titleCase(e.name),
      tag: e.types.join(","),
    });
  }

  // ── Type ────────────────────────────────────────────────────────────
  console.log("Building type bundles…");
  const types = buildTypeBundles();
  for (const t of types) writeBundle(`type/${t.name}.json`, t);
  writeBundle("type/_index.json", {
    kind: "type-index",
    total: types.length,
    entries: types.map((t) => ({
      name: t.name,
      id: t.id,
      display_name: titleCase(t.name),
      generation: t.generation,
    })),
  });
  console.log(`  ${types.length} type bundles.`);
  for (const t of types) {
    search.push({ kind: "type", name: t.name, id: t.id, display_name: titleCase(t.name) });
  }

  // ── Ability ─────────────────────────────────────────────────────────
  console.log("Building ability bundles…");
  const abilities = buildAbilityBundles();
  for (const a of abilities) writeBundle(`ability/${a.name}.json`, a);
  writeBundle("ability/_index.json", {
    kind: "ability-index",
    total: abilities.length,
    entries: abilities.map((a) => ({
      name: a.name,
      id: a.id,
      display_name: a.display_name,
      generation: a.generation,
    })),
  });
  console.log(`  ${abilities.length} ability bundles.`);
  for (const a of abilities) {
    search.push({ kind: "ability", name: a.name, id: a.id, display_name: a.display_name });
  }

  // ── Species ─────────────────────────────────────────────────────────
  console.log("Building species bundles…");
  const species = buildSpeciesBundles();
  for (const s of species) writeBundle(`pokemon-species/${s.name}.json`, s);
  console.log(`  ${species.length} species bundles.`);
  for (const s of species) {
    search.push({ kind: "species", name: s.name, id: s.id, display_name: s.display_name });
  }

  // ── Form ────────────────────────────────────────────────────────────
  console.log("Building form bundles…");
  const forms = buildFormBundles();
  for (const f of forms) writeBundle(`pokemon-form/${f.name}.json`, f);
  console.log(`  ${forms.length} form bundles.`);

  // ── Berry ───────────────────────────────────────────────────────────
  console.log("Building berry bundles…");
  const berries = buildBerryBundles();
  for (const b of berries) writeBundle(`berry/${b.name}.json`, b);
  writeBundle("berry/_index.json", {
    kind: "berry-index",
    total: berries.length,
    entries: berries.map((b) => ({
      name: b.name,
      id: b.id,
      display_name: b.display_name,
      firmness: b.firmness,
      natural_gift_type: b.natural_gift_type,
    })),
  });
  console.log(`  ${berries.length} berry bundles.`);
  for (const b of berries) {
    search.push({
      kind: "berry",
      name: b.name,
      id: b.id,
      display_name: b.display_name,
      tag: b.natural_gift_type,
    });
  }

  // ── Item ────────────────────────────────────────────────────────────
  console.log("Building item bundles…");
  const items = buildItemBundles();
  for (const it of items) writeBundle(`item/${it.name}.json`, it);
  writeBundle("item/_index.json", {
    kind: "item-index",
    total: items.length,
    entries: items.map((it) => ({
      name: it.name,
      id: it.id,
      display_name: it.display_name,
      category: it.category,
      cost: it.cost,
      sprite: it.sprite,
    })),
  });
  console.log(`  ${items.length} item bundles.`);
  for (const it of items) {
    search.push({
      kind: "item",
      name: it.name,
      id: it.id,
      display_name: it.display_name,
      tag: it.category,
    });
  }

  // ── Location ────────────────────────────────────────────────────────
  console.log("Building location bundles…");
  const locations = buildLocationBundles();
  for (const l of locations) writeBundle(`location/${l.name}.json`, l);
  writeBundle("location/_index.json", {
    kind: "location-index",
    total: locations.length,
    entries: locations.map((l) => ({
      name: l.name,
      id: l.id,
      display_name: l.display_name,
      region: l.region,
    })),
  });
  console.log(`  ${locations.length} location bundles.`);
  for (const l of locations) {
    search.push({
      kind: "location",
      name: l.name,
      id: l.id,
      display_name: l.display_name,
      tag: l.region ?? undefined,
    });
  }

  // ── Move ────────────────────────────────────────────────────────────
  console.log("Building move bundles…");
  const moves = buildMoveBundles();
  for (const m of moves) writeBundle(`move/${m.name}.json`, m);
  writeBundle("move/_index.json", {
    kind: "move-index",
    total: moves.length,
    entries: moves.map((m) => ({
      name: m.name,
      id: m.id,
      display_name: m.display_name,
      type: m.type,
      damage_class: m.damage_class,
      power: m.power,
      accuracy: m.accuracy,
    })),
  });
  console.log(`  ${moves.length} move bundles.`);
  for (const m of moves) {
    search.push({
      kind: "move",
      name: m.name,
      id: m.id,
      display_name: m.display_name,
      tag: m.type,
    });
  }

  // ── Generation ──────────────────────────────────────────────────────
  console.log("Building generation bundles…");
  const generations = buildGenerationBundles();
  for (const g of generations) writeBundle(`generation/${g.name}.json`, g);
  writeBundle("generation/_index.json", {
    kind: "generation-index",
    total: generations.length,
    entries: generations.map((g) => ({
      name: g.name,
      id: g.id,
      display_name: g.display_name,
      main_region: g.main_region,
    })),
  });
  console.log(`  ${generations.length} generation bundles.`);
  for (const g of generations) {
    search.push({
      kind: "generation",
      name: g.name,
      id: g.id,
      display_name: g.display_name,
      tag: g.main_region,
    });
  }

  // ── Unified search index ────────────────────────────────────────────
  console.log("Writing unified search index…");
  const index: SearchIndexBundle = {
    kind: "search-index",
    total: search.length,
    entries: search,
  };
  writeBundle("search-index.json", index);
  console.log(`  ${search.length} searchable entries.`);

  // ── Summaries passthrough ───────────────────────────────────────────
  console.log("Copying data_generated/summary/ → bundles/summary/…");
  copySummaries();

  console.log("\nDone. Output:", OUT_ROOT);
}

// Local titleCase — duplicated here to keep the script free of app imports.
function titleCase(name: string): string {
  return name
    .split(/[-_\s]/)
    .filter(Boolean)
    .map((p) => p[0]!.toUpperCase() + p.slice(1))
    .join(" ");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
