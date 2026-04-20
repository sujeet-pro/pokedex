/**
 * Slug cache: given a reference to another entity, returns a
 * locale-specific URL slug. Mirrors name-cache's lookup strategy and
 * reuses it where possible.
 */
import type { Locale } from "../../src/types/locales";
import type { SlugMap } from "../../src/types/bundles";
import { LOCALES } from "../../src/types/locales";
import { slugify } from "./slugify";
import {
  typeDisplayName,
  abilityDisplayName,
  itemDisplayName,
  moveDisplayName,
  berryDisplayName,
  berryFirmnessDisplayName,
  speciesDisplayName,
  pokemonDisplayName,
  pokemonFormDisplayName,
  generationDisplayName,
  locationDisplayName,
  locationAreaDisplayName,
  itemCategoryDisplayName,
  moveDamageClassDisplayName,
} from "./name-cache";
import type { NamedRef } from "./pokeapi";
import { refIdSafe } from "./pokeapi";

type Kind =
  | "type"
  | "ability"
  | "item"
  | "move"
  | "berry"
  | "berry-firmness"
  | "species"
  | "pokemon-form"
  | "pokemon"
  | "generation"
  | "location"
  | "location-area"
  | "item-category"
  | "move-damage-class";

const slugCache = new Map<string, string>();

function resolveOneName(kind: Kind, id: number, fallback: string, lang: Locale): string {
  switch (kind) {
    case "type": return typeDisplayName(id, fallback, lang);
    case "ability": return abilityDisplayName(id, fallback, lang);
    case "item": return itemDisplayName(id, fallback, lang);
    case "move": return moveDisplayName(id, fallback, lang);
    case "berry": return berryDisplayName(id, fallback, lang);
    case "berry-firmness": return berryFirmnessDisplayName(id, fallback, lang);
    case "species": return speciesDisplayName(id, fallback, lang);
    case "pokemon-form": return pokemonFormDisplayName(id, fallback, lang);
    case "pokemon": return pokemonDisplayName(id, fallback, lang);
    case "generation": return generationDisplayName(id, fallback, lang);
    case "location": return locationDisplayName(id, fallback, lang);
    case "location-area": return locationAreaDisplayName(id, fallback, lang);
    case "item-category": return itemCategoryDisplayName(id, fallback, lang);
    case "move-damage-class": return moveDamageClassDisplayName(id, fallback, lang);
  }
}

/** Localized slug for a resource reference, with a cheap in-memory cache. */
export function slugFor(kind: Kind, id: number, canonical: string, lang: Locale): string {
  const key = `${kind}:${id}:${lang}`;
  const hit = slugCache.get(key);
  if (hit !== undefined) return hit;
  const dn = resolveOneName(kind, id, canonical, lang);
  const result = slugify(dn, slugify(canonical, canonical));
  slugCache.set(key, result);
  return result;
}

/** Full slug map across all locales for a resource reference. */
export function slugMapFor(kind: Kind, id: number, canonical: string): SlugMap {
  const out = {} as SlugMap;
  for (const lang of LOCALES) {
    out[lang] = slugFor(kind, id, canonical, lang);
  }
  return out;
}

/** Slug via a NamedRef; returns canonical slug if ID unresolvable. */
export function slugForRef(kind: Kind, ref: NamedRef, lang: Locale): string {
  const id = refIdSafe(ref);
  if (id == null) return slugify(ref.name, ref.name);
  return slugFor(kind, id, ref.name, lang);
}

export function slugMapForRef(kind: Kind, ref: NamedRef): SlugMap {
  const id = refIdSafe(ref);
  if (id == null) {
    const base = slugify(ref.name, ref.name);
    return { en: base, fr: base } as SlugMap;
  }
  return slugMapFor(kind, id, ref.name);
}
