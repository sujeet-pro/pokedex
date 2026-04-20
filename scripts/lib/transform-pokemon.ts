import type {
  PokemonBundle,
  PokemonIndexEntry,
  BundleAbilityEntry,
  BundleDefenderType,
} from "../../src/types/bundles";
import type { Locale } from "../../src/types/locales";
import {
  readPokemon,
  readSpecies,
  readAbility,
  readType,
  refId,
  refIdSafe,
  type PokemonRaw,
  type PokemonSpeciesRaw,
} from "./pokeapi";
import {
  cleanFlavor,
  escapeHtml,
  paragraphHtml,
  pickEffect,
  pickFlavor,
  pickGenus,
  pickName,
} from "./localize";
import { buildEvolutionChainForSpecies } from "./evolution";
import { readSummaryHtml } from "./summary";
import {
  generationDisplayName,
  humanize,
  typeDisplayName,
} from "./name-cache";
import { slugFor, slugForRef, slugMapFor } from "./slug-cache";
import { slugify } from "./slugify";

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
      slug: slugFor("ability", abilityId, name, lang),
      display_name: displayName,
      is_hidden: a.is_hidden,
      slot: a.slot,
      short_effect_html: shortEffectHtml,
    });
  }
  items.sort((a, b) => a.slot - b.slot);
  return items;
}

function buildDefenders(raw: PokemonRaw, lang: Locale): BundleDefenderType[] {
  const out: BundleDefenderType[] = [];
  for (const t of raw.types.slice().sort((a, b) => a.slot - b.slot)) {
    const id = refIdSafe(t.type);
    if (id == null) continue;
    const type = readType(id);
    if (!type) continue;
    out.push({
      name: t.type.name,
      slug: slugFor("type", id, t.type.name, lang),
      display_name: typeDisplayName(id, t.type.name, lang),
      double_damage_from: type.damage_relations.double_damage_from.map((r) => r.name),
      half_damage_from: type.damage_relations.half_damage_from.map((r) => r.name),
      no_damage_from: type.damage_relations.no_damage_from.map((r) => r.name),
    });
  }
  return out;
}

function buildSpeciesBlock(sp: PokemonSpeciesRaw, fallbackName: string, lang: Locale) {
  const flavorText = pickFlavor(sp.flavor_text_entries, lang);
  const generationId = refIdSafe(sp.generation);
  const genDisplay =
    generationId != null ? generationDisplayName(generationId, sp.generation.name, lang) : humanize(sp.generation.name);

  return {
    name: sp.name,
    slug: slugFor("species", sp.id, sp.name, lang),
    slugs: slugMapFor("species", sp.id, sp.name),
    display_name: pickName(sp.names, lang, fallbackName),
    genus: pickGenus(sp.genera, lang),
    generation: sp.generation.name,
    generation_display: genDisplay,
    capture_rate: sp.capture_rate,
    base_happiness: sp.base_happiness ?? 0,
    hatch_counter: sp.hatch_counter,
    color: sp.color?.name ?? "unknown",
    color_display: humanize(sp.color?.name ?? "unknown"),
    shape: sp.shape?.name ?? null,
    shape_display: sp.shape ? humanize(sp.shape.name) : null,
    habitat: sp.habitat?.name ?? null,
    habitat_display: sp.habitat ? humanize(sp.habitat.name) : null,
    growth_rate: sp.growth_rate.name,
    growth_rate_display: humanize(sp.growth_rate.name),
    egg_groups: sp.egg_groups.map((g) => g.name),
    egg_groups_display: sp.egg_groups.map((g) => humanize(g.name)),
    is_legendary: sp.is_legendary,
    is_mythical: sp.is_mythical,
    is_baby: sp.is_baby,
    flavor_html: paragraphHtml(flavorText),
    flavor_text: cleanFlavor(flavorText),
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

  const types = raw.types
    .slice()
    .sort((a, b) => a.slot - b.slot)
    .map((t) => {
      const tid = refIdSafe(t.type);
      return {
        slot: t.slot,
        name: t.type.name,
        slug: tid != null ? slugFor("type", tid, t.type.name, lang) : t.type.name,
        display_name: tid != null ? typeDisplayName(tid, t.type.name, lang) : humanize(t.type.name),
      };
    });

  const stats = raw.stats.map((s) => ({ name: s.stat.name, base_stat: s.base_stat }));
  const stats_total = stats.reduce((a, s) => a + s.base_stat, 0);

  const pager = {
    prev: prevId != null ? buildPagerEntry(prevId, lang) : null,
    next: nextId != null ? buildPagerEntry(nextId, lang) : null,
  };

  const slug = slugify(displayName, raw.name);
  const slugs = slugMapFor("pokemon", raw.id, raw.name);

  const bundle: PokemonBundle = {
    kind: "pokemon",
    id: raw.id,
    name: raw.name,
    slug,
    slugs,
    display_name: displayName,
    order: raw.order,
    height: raw.height,
    weight: raw.weight,
    base_experience: raw.base_experience,
    types,
    stats,
    stats_total,
    sprites: {
      front_default: raw.sprites.front_default,
      official_artwork: spriteArtwork(raw),
    },
    abilities: buildAbilities(raw, lang),
    forms: raw.forms.map((f) => {
      const fid = refIdSafe(f);
      return {
        name: f.name,
        slug: fid != null ? slugFor("pokemon-form", fid, f.name, lang) : slugify(f.name, f.name),
        display_name: fid != null ? slugFor("pokemon-form", fid, f.name, lang).replace(/-/g, " ") : escapeDisplay(f.name),
        id: fid ?? 0,
      };
    }),
    species: buildSpeciesBlock(species, raw.name, lang),
    evolution_chain: buildEvolutionChainForSpecies(speciesId, lang),
    defenders: buildDefenders(raw, lang),
    pager,
    summary_html: readSummaryHtml(raw.id, lang),
  };

  const indexEntry: PokemonIndexEntry = {
    id: raw.id,
    name: raw.name,
    slug,
    slugs,
    display_name: displayName,
    types: types.map((t) => t.name),
  };

  return { bundle, indexEntry };
}

function buildPagerEntry(id: number, lang: Locale) {
  try {
    const p = readPokemon(id);
    const sp = readSpecies(refId(p.species));
    const dn = pickName(sp.names, lang, p.name);
    return {
      name: p.name,
      slug: slugFor("pokemon", id, p.name, lang),
      display_name: dn,
      id,
    };
  } catch {
    return { name: String(id), slug: String(id), display_name: String(id), id };
  }
}

function escapeDisplay(s: string): string {
  return escapeHtml(s.replace(/-/g, " "));
}
