// Transforms for the new resource groups added in Phase 2: berry, item,
// location, move, generation.

import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { DATA_ROOT, readRecord } from "../io.ts";
import type {
  BerryDetail,
  GenerationDetail,
  ItemDetail,
  LocationDetail,
  MoveDetail,
  VersionGroupedText,
} from "~/types/pokeapi";
import type {
  BerryBundle,
  GenerationBundle,
  ItemBundle,
  LocationBundle,
  MoveBundle,
} from "~/types/bundles";

const langEn = <T extends { language: { name: string } }>(xs: T[]): T | undefined =>
  xs.find((x) => x.language.name === "en");

const titleCase = (name: string): string =>
  name
    .split(/[-_\s]/)
    .filter(Boolean)
    .map((p) => p[0]!.toUpperCase() + p.slice(1))
    .join(" ");

const cleanFlavor = (text: string): string => text.replace(/\s+/g, " ").trim();

function idFromUrl(url: string): number {
  const m = url.match(/\/(\d+)\/?$/);
  if (!m) throw new Error(`no numeric id in ${url}`);
  return Number(m[1]);
}

function listIds(resource: string): number[] {
  return readdirSync(resolve(DATA_ROOT, resource))
    .filter((n) => /^\d+$/.test(n))
    .map(Number)
    .sort((a, b) => a - b);
}

// Pick the most recent English flavor text (last version group in the array).
function latestEnFlavor(entries: VersionGroupedText[]): string | null {
  const en = entries.filter((e) => e.language.name === "en");
  if (en.length === 0) return null;
  const text = en[en.length - 1]!;
  const raw = text.text ?? text.flavor_text ?? "";
  return raw ? cleanFlavor(raw) : null;
}

export function buildBerryBundles(): BerryBundle[] {
  const out: BerryBundle[] = [];
  for (const id of listIds("berry")) {
    const raw = readRecord<BerryDetail>(`berry/${id}`);
    out.push({
      kind: "berry",
      id: raw.id,
      name: raw.name,
      display_name: `${titleCase(raw.name)} Berry`,
      firmness: raw.firmness.name,
      growth_time: raw.growth_time,
      max_harvest: raw.max_harvest,
      natural_gift_power: raw.natural_gift_power,
      natural_gift_type: raw.natural_gift_type.name,
      size: raw.size,
      smoothness: raw.smoothness,
      soil_dryness: raw.soil_dryness,
      flavors: raw.flavors.map((f) => ({ name: f.flavor.name, potency: f.potency })),
      item: { name: raw.item.name },
    });
  }
  return out;
}

export function buildItemBundles(): ItemBundle[] {
  const out: ItemBundle[] = [];
  for (const id of listIds("item")) {
    const raw = readRecord<ItemDetail>(`item/${id}`);
    const effect = langEn(raw.effect_entries);
    out.push({
      kind: "item",
      id: raw.id,
      name: raw.name,
      display_name: langEn(raw.names)?.name ?? titleCase(raw.name),
      category: raw.category.name,
      cost: raw.cost,
      fling_power: raw.fling_power,
      fling_effect: raw.fling_effect?.name ?? null,
      attributes: raw.attributes.map((a) => a.name),
      short_effect: effect?.short_effect ?? null,
      effect: effect?.effect ?? null,
      flavor: latestEnFlavor(raw.flavor_text_entries),
      sprite: raw.sprites.default,
      held_by_pokemon: raw.held_by_pokemon.map((h) => ({ name: h.pokemon.name })),
    });
  }
  return out;
}

export function buildLocationBundles(): LocationBundle[] {
  const out: LocationBundle[] = [];
  for (const id of listIds("location")) {
    const raw = readRecord<LocationDetail>(`location/${id}`);
    const firstGame = raw.game_indices[0];
    out.push({
      kind: "location",
      id: raw.id,
      name: raw.name,
      display_name: langEn(raw.names)?.name ?? titleCase(raw.name),
      region: raw.region?.name ?? null,
      generation: firstGame?.generation.name ?? null,
      areas: raw.areas.map((a) => ({ name: a.name })),
    });
  }
  return out;
}

export function buildMoveBundles(): MoveBundle[] {
  const out: MoveBundle[] = [];
  for (const id of listIds("move")) {
    const raw = readRecord<MoveDetail>(`move/${id}`);
    const effect = langEn(raw.effect_entries);
    out.push({
      kind: "move",
      id: raw.id,
      name: raw.name,
      display_name: langEn(raw.names)?.name ?? titleCase(raw.name),
      type: raw.type.name,
      damage_class: raw.damage_class.name,
      power: raw.power,
      accuracy: raw.accuracy,
      pp: raw.pp,
      priority: raw.priority,
      target: raw.target.name,
      generation: raw.generation.name,
      short_effect: effect?.short_effect ?? null,
      effect: effect?.effect ?? null,
      effect_chance: raw.effect_chance,
      flavor: latestEnFlavor(raw.flavor_text_entries),
      learned_by_pokemon: raw.learned_by_pokemon.map((p) => ({
        name: p.name,
        id: idFromUrl(p.url),
      })),
    });
  }
  return out;
}

export function buildGenerationBundles(): GenerationBundle[] {
  const out: GenerationBundle[] = [];
  for (const id of listIds("generation")) {
    const raw = readRecord<GenerationDetail>(`generation/${id}`);
    out.push({
      kind: "generation",
      id: raw.id,
      name: raw.name,
      display_name: langEn(raw.names)?.name ?? titleCase(raw.name.replace("generation-", "")),
      main_region: raw.main_region.name,
      version_groups: raw.version_groups.map((v) => ({ name: v.name })),
      pokemon_species_count: raw.pokemon_species.length,
      moves_count: raw.moves.length,
      types: raw.types.map((t) => ({ name: t.name })),
      abilities: raw.abilities.map((a) => ({ name: a.name })),
    });
  }
  return out;
}
