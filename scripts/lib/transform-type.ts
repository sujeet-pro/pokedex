import type { Locale } from "../../src/types/locales";
import type { TypeBundle, TypeIndexEntry, NamedRef as BundleNamedRef } from "../../src/types/bundles";
import { readType, refIdSafe, type NamedRef } from "./pokeapi";
import { pickName } from "./localize";
import { pokemonDisplayName, typeDisplayName, generationDisplayName } from "./name-cache";
import { slugFor, slugForRef, slugMapFor } from "./slug-cache";
import { slugify } from "./slugify";

function mapTypeRefs(refs: NamedRef[], lang: Locale): BundleNamedRef[] {
  return refs.map((r) => {
    const id = refIdSafe(r) ?? 0;
    return {
      id,
      name: r.name,
      slug: slugForRef("type", r, lang),
      display_name: typeDisplayName(id, r.name, lang),
    };
  });
}

export function buildTypeBundle(
  id: number,
  lang: Locale,
): { bundle: TypeBundle; indexEntry: TypeIndexEntry } | null {
  const raw = readType(id);
  if (!raw) return null;
  const displayName = pickName(raw.names, lang, raw.name);
  const generation = raw.generation?.name ?? "unknown";
  const genId = raw.generation ? refIdSafe(raw.generation) : null;
  const generationDisplay = genId != null ? generationDisplayName(genId, generation, lang) : generation;

  const pokemon = raw.pokemon.map((p) => {
    const pid = refIdSafe(p.pokemon) ?? 0;
    return {
      name: p.pokemon.name,
      slug: slugFor("pokemon", pid, p.pokemon.name, lang),
      display_name: pokemonDisplayName(pid, p.pokemon.name, lang),
      id: pid,
      slot: p.slot,
    };
  });

  const slug = slugify(displayName, raw.name);
  const slugs = slugMapFor("type", raw.id, raw.name);

  const bundle: TypeBundle = {
    kind: "type",
    id: raw.id,
    name: raw.name,
    slug,
    slugs,
    display_name: displayName,
    generation,
    generation_display: generationDisplay,
    relations: {
      double_damage_to: mapTypeRefs(raw.damage_relations.double_damage_to, lang),
      half_damage_to: mapTypeRefs(raw.damage_relations.half_damage_to, lang),
      no_damage_to: mapTypeRefs(raw.damage_relations.no_damage_to, lang),
      double_damage_from: mapTypeRefs(raw.damage_relations.double_damage_from, lang),
      half_damage_from: mapTypeRefs(raw.damage_relations.half_damage_from, lang),
      no_damage_from: mapTypeRefs(raw.damage_relations.no_damage_from, lang),
    },
    pokemon,
  };

  const indexEntry: TypeIndexEntry = {
    id: raw.id,
    name: raw.name,
    slug,
    slugs,
    display_name: displayName,
    generation,
  };

  return { bundle, indexEntry };
}
