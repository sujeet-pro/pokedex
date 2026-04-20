import type { PokemonBundle, PokemonIndexEntry, BundleAbilityEntry } from "../../src/types/bundles";
import type { Locale } from "../../src/types/locales";
import {
  readPokemon,
  readSpecies,
  readAbility,
  refId,
  type PokemonRaw,
  type PokemonSpeciesRaw,
} from "./pokeapi";
import { escapeHtml, paragraphHtml, pickEffect, pickFlavor, pickGenus, pickName } from "./localize";

function spriteArtwork(p: PokemonRaw): string | null {
  const art = p.sprites.other?.["official-artwork"]?.front_default ?? null;
  return art ?? null;
}

function buildAbilities(raw: PokemonRaw, lang: Locale): BundleAbilityEntry[] {
  const items: BundleAbilityEntry[] = [];
  for (const a of raw.abilities) {
    const abilityId = refId(a.ability);
    const ability = readAbility(abilityId);
    const name = a.ability.name;
    const displayName = ability ? pickName(ability.names, lang, name) : name;
    const effect = ability ? pickEffect(ability.effect_entries, lang) : undefined;
    const shortEffectHtml = effect ? paragraphHtml(effect.short_effect) : "";
    items.push({
      name,
      display_name: displayName,
      is_hidden: a.is_hidden,
      slot: a.slot,
      short_effect_html: shortEffectHtml,
    });
  }
  items.sort((a, b) => a.slot - b.slot);
  return items;
}

function buildSpeciesBlock(sp: PokemonSpeciesRaw, fallbackName: string, lang: Locale) {
  return {
    name: sp.name,
    display_name: pickName(sp.names, lang, fallbackName),
    genus: pickGenus(sp.genera, lang),
    generation: sp.generation.name,
    capture_rate: sp.capture_rate,
    base_happiness: sp.base_happiness ?? 0,
    hatch_counter: sp.hatch_counter,
    color: sp.color?.name ?? "unknown",
    shape: sp.shape?.name ?? null,
    habitat: sp.habitat?.name ?? null,
    growth_rate: sp.growth_rate.name,
    egg_groups: sp.egg_groups.map((g) => g.name),
    is_legendary: sp.is_legendary,
    is_mythical: sp.is_mythical,
    is_baby: sp.is_baby,
    flavor_html: paragraphHtml(pickFlavor(sp.flavor_text_entries, lang)),
  };
}

export type BuildContext = {
  displayNames: Map<number, { en: string; fr: string }>;
  orderedIds: number[];
};

export function buildPokemonBundle(
  id: number,
  lang: Locale,
  ctx: BuildContext,
): { bundle: PokemonBundle; indexEntry: PokemonIndexEntry } {
  const raw = readPokemon(id);
  const speciesId = refId(raw.species);
  const species = readSpecies(speciesId);

  const displayName = pickName(species.names, lang, raw.name);

  const ordered = ctx.orderedIds;
  const pos = ordered.indexOf(id);
  const prevId = pos > 0 ? ordered[pos - 1]! : null;
  const nextId = pos >= 0 && pos < ordered.length - 1 ? ordered[pos + 1]! : null;
  const pager = {
    prev: prevId != null
      ? { name: nameForId(prevId), id: prevId }
      : null,
    next: nextId != null
      ? { name: nameForId(nextId), id: nextId }
      : null,
  };

  const bundle: PokemonBundle = {
    kind: "pokemon",
    id: raw.id,
    name: raw.name,
    display_name: displayName,
    order: raw.order,
    height: raw.height,
    weight: raw.weight,
    base_experience: raw.base_experience,
    types: raw.types
      .sort((a, b) => a.slot - b.slot)
      .map((t) => ({ slot: t.slot, name: t.type.name })),
    stats: raw.stats.map((s) => ({ name: s.stat.name, base_stat: s.base_stat })),
    sprites: {
      front_default: raw.sprites.front_default,
      official_artwork: spriteArtwork(raw),
    },
    abilities: buildAbilities(raw, lang),
    forms: raw.forms.map((f) => ({ name: f.name, display_name: escapeDisplay(f.name) })),
    species: buildSpeciesBlock(species, raw.name, lang),
    evolution_chain: null,
    defenders: [],
    pager,
    summary_html: null,
  };

  const indexEntry: PokemonIndexEntry = {
    id: raw.id,
    name: raw.name,
    display_name: displayName,
    types: bundle.types.map((t) => t.name),
  };

  return { bundle, indexEntry };
}

function nameForId(id: number): string {
  try {
    const p = readPokemon(id);
    return p.name;
  } catch {
    return String(id);
  }
}

function escapeDisplay(s: string): string {
  return escapeHtml(s.replace(/-/g, " "));
}
