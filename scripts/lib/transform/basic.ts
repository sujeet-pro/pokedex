// Transforms for the legacy resources that the v2 UI already ships with:
// type, ability, species, form. Each produces one bundle per record keyed by
// the record's name.

import { readdirSync } from "node:fs";
import { DATA_ROOT, readRecord } from "../io.ts";
import { resolve } from "node:path";
import type {
  AbilityDetail,
  PokemonForm,
  PokemonSpecies,
  TypeDetail,
} from "~/types/pokeapi";
import type {
  AbilityBundle,
  FormBundle,
  SpeciesBundle,
  TypeBundle,
} from "~/types/bundles";

const langEn = <T extends { language: { name: string } }>(xs: T[]): T | undefined =>
  xs.find((x) => x.language.name === "en");

const cleanFlavor = (text: string): string => text.replace(/\s+/g, " ").trim();

const titleCase = (name: string): string =>
  name
    .split(/[-_\s]/)
    .filter(Boolean)
    .map((p) => p[0]!.toUpperCase() + p.slice(1))
    .join(" ");

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

export function buildTypeBundles(): TypeBundle[] {
  const out: TypeBundle[] = [];
  for (const id of listIds("type")) {
    const raw = readRecord<TypeDetail>(`type/${id}`);
    const r = raw.damage_relations;
    out.push({
      kind: "type",
      id: raw.id,
      name: raw.name,
      generation: raw.generation.name,
      relations: {
        double_damage_to: r.double_damage_to.map((x) => x.name),
        half_damage_to: r.half_damage_to.map((x) => x.name),
        no_damage_to: r.no_damage_to.map((x) => x.name),
        double_damage_from: r.double_damage_from.map((x) => x.name),
        half_damage_from: r.half_damage_from.map((x) => x.name),
        no_damage_from: r.no_damage_from.map((x) => x.name),
      },
      pokemon: raw.pokemon.map((p) => ({
        name: p.pokemon.name,
        id: idFromUrl(p.pokemon.url),
        slot: p.slot,
      })),
    });
  }
  return out;
}

export function buildAbilityBundles(): AbilityBundle[] {
  const out: AbilityBundle[] = [];
  for (const id of listIds("ability")) {
    const raw = readRecord<AbilityDetail>(`ability/${id}`);
    const effect = langEn(raw.effect_entries);
    const flavor = langEn(raw.flavor_text_entries);
    out.push({
      kind: "ability",
      id: raw.id,
      name: raw.name,
      display_name: langEn(raw.names)?.name ?? titleCase(raw.name),
      generation: raw.generation.name,
      short_effect: effect?.short_effect ?? null,
      effect: effect?.effect ?? null,
      flavor: flavor ? cleanFlavor(flavor.flavor_text) : null,
      pokemon: raw.pokemon.map((p) => ({
        name: p.pokemon.name,
        id: idFromUrl(p.pokemon.url),
        is_hidden: p.is_hidden,
      })),
    });
  }
  return out;
}

export function buildSpeciesBundles(): SpeciesBundle[] {
  const out: SpeciesBundle[] = [];
  for (const id of listIds("pokemon-species")) {
    const raw = readRecord<PokemonSpecies>(`pokemon-species/${id}`);
    out.push({
      kind: "species",
      id: raw.id,
      name: raw.name,
      display_name: langEn(raw.names)?.name ?? titleCase(raw.name),
      genus: langEn(raw.genera)?.genus ?? null,
      flavor: (() => {
        const f = langEn(raw.flavor_text_entries);
        return f ? cleanFlavor(f.flavor_text) : "";
      })(),
      generation: raw.generation.name,
      color: raw.color.name,
      shape: raw.shape?.name ?? null,
      habitat: raw.habitat?.name ?? null,
      capture_rate: raw.capture_rate,
      base_happiness: raw.base_happiness,
      is_legendary: raw.is_legendary,
      is_mythical: raw.is_mythical,
      is_baby: raw.is_baby,
      varieties: raw.varieties.map((v) => ({
        name: v.pokemon.name,
        is_default: v.is_default,
      })),
    });
  }
  return out;
}

export function buildFormBundles(): FormBundle[] {
  const out: FormBundle[] = [];
  for (const id of listIds("pokemon-form")) {
    const raw = readRecord<PokemonForm>(`pokemon-form/${id}`);
    out.push({
      kind: "form",
      id: raw.id,
      name: raw.name,
      form_name: raw.form_name,
      display_name: langEn(raw.names)?.name ?? titleCase(raw.name),
      pokemon: { name: raw.pokemon.name },
      types: raw.types.map((t) => ({ slot: t.slot, name: t.type.name })),
      sprites: { front_default: raw.sprites.front_default },
      version_group: raw.version_group.name,
    });
  }
  return out;
}
