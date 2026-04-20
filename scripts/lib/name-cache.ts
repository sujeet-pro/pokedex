import {
  readType,
  readAbility,
  readItem,
  readMove,
  readBerry,
  readBerryFirmness,
  readSpecies,
  readPokemonForm,
  readGeneration,
  readLocation,
  readLocationArea,
  readItemCategory,
  readMoveDamageClass,
  readPokemon,
  refIdSafe,
  type NamedRef,
} from "./pokeapi";
import { pickName } from "./localize";
import type { Locale } from "../../src/types/locales";

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

type CacheKey = `${Kind}:${number}:${Locale}`;

const cache = new Map<CacheKey, string>();

function cached(kind: Kind, id: number, lang: Locale, resolve: () => string): string {
  const key: CacheKey = `${kind}:${id}:${lang}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const value = resolve();
  cache.set(key, value);
  return value;
}

function cap(s: string): string {
  return s
    .split("-")
    .map((p) => (p.length > 0 ? p[0]!.toUpperCase() + p.slice(1) : p))
    .join(" ");
}

export function typeDisplayName(id: number, fallback: string, lang: Locale): string {
  return cached("type", id, lang, () => {
    const raw = readType(id);
    if (!raw) return cap(fallback);
    return pickName(raw.names, lang, cap(fallback));
  });
}

export function abilityDisplayName(id: number, fallback: string, lang: Locale): string {
  return cached("ability", id, lang, () => {
    const raw = readAbility(id);
    if (!raw) return cap(fallback);
    return pickName(raw.names, lang, cap(fallback));
  });
}

export function itemDisplayName(id: number, fallback: string, lang: Locale): string {
  return cached("item", id, lang, () => {
    const raw = readItem(id);
    if (!raw) return cap(fallback);
    return pickName(raw.names, lang, cap(fallback));
  });
}

export function moveDisplayName(id: number, fallback: string, lang: Locale): string {
  return cached("move", id, lang, () => {
    const raw = readMove(id);
    if (!raw) return cap(fallback);
    return pickName(raw.names, lang, cap(fallback));
  });
}

export function berryDisplayName(id: number, fallback: string, lang: Locale): string {
  return cached("berry", id, lang, () => {
    const raw = readBerry(id);
    if (!raw) return cap(fallback);
    // Berries inherit a localized item name via their `item` link
    const itemId = refIdSafe(raw.item);
    if (itemId != null) {
      const item = readItem(itemId);
      if (item) return pickName(item.names, lang, cap(raw.name));
    }
    return cap(raw.name);
  });
}

export function berryFirmnessDisplayName(id: number, fallback: string, lang: Locale): string {
  return cached("berry-firmness", id, lang, () => {
    const raw = readBerryFirmness(id);
    if (!raw) return cap(fallback);
    return pickName(raw.names, lang, cap(fallback));
  });
}

export function speciesDisplayName(id: number, fallback: string, lang: Locale): string {
  return cached("species", id, lang, () => {
    const raw = readSpecies(id);
    return pickName(raw.names, lang, cap(fallback));
  });
}

export function pokemonDisplayName(id: number, fallback: string, lang: Locale): string {
  return cached("pokemon", id, lang, () => {
    const p = readPokemon(id);
    const sp = readSpecies(refIdSafe(p.species) ?? 0);
    if (!sp) return cap(fallback);
    return pickName(sp.names, lang, cap(fallback));
  });
}

export function pokemonFormDisplayName(id: number, fallback: string, lang: Locale): string {
  return cached("pokemon-form", id, lang, () => {
    const raw = readPokemonForm(id);
    if (!raw) return cap(fallback);
    const name = pickName(raw.names, lang, "");
    if (name) return name;
    return cap(fallback);
  });
}

export function generationDisplayName(id: number, fallback: string, lang: Locale): string {
  return cached("generation", id, lang, () => {
    const raw = readGeneration(id);
    if (!raw) return cap(fallback);
    return pickName(raw.names, lang, cap(fallback));
  });
}

export function locationDisplayName(id: number, fallback: string, lang: Locale): string {
  return cached("location", id, lang, () => {
    const raw = readLocation(id);
    if (!raw) return cap(fallback);
    return pickName(raw.names, lang, cap(fallback));
  });
}

export function locationAreaDisplayName(id: number, fallback: string, lang: Locale): string {
  return cached("location-area", id, lang, () => {
    const raw = readLocationArea(id);
    if (!raw) return cap(fallback);
    return pickName(raw.names, lang, cap(fallback));
  });
}

export function itemCategoryDisplayName(id: number, fallback: string, lang: Locale): string {
  return cached("item-category", id, lang, () => {
    const raw = readItemCategory(id);
    if (!raw) return cap(fallback);
    return pickName(raw.names, lang, cap(fallback));
  });
}

export function moveDamageClassDisplayName(
  id: number,
  fallback: string,
  lang: Locale,
): string {
  return cached("move-damage-class", id, lang, () => {
    const raw = readMoveDamageClass(id);
    if (!raw) return cap(fallback);
    return pickName(raw.names, lang, cap(fallback));
  });
}

export function humanize(s: string): string {
  return cap(s);
}

// Convenience for named ref (safe id extraction).
export function resolveDisplayName(
  kind: Kind,
  ref: NamedRef,
  lang: Locale,
): string {
  const id = refIdSafe(ref);
  if (id == null) return cap(ref.name);
  switch (kind) {
    case "type":
      return typeDisplayName(id, ref.name, lang);
    case "ability":
      return abilityDisplayName(id, ref.name, lang);
    case "item":
      return itemDisplayName(id, ref.name, lang);
    case "move":
      return moveDisplayName(id, ref.name, lang);
    case "berry":
      return berryDisplayName(id, ref.name, lang);
    case "berry-firmness":
      return berryFirmnessDisplayName(id, ref.name, lang);
    case "species":
      return speciesDisplayName(id, ref.name, lang);
    case "pokemon-form":
      return pokemonFormDisplayName(id, ref.name, lang);
    case "pokemon":
      return pokemonDisplayName(id, ref.name, lang);
    case "generation":
      return generationDisplayName(id, ref.name, lang);
    case "location":
      return locationDisplayName(id, ref.name, lang);
    case "location-area":
      return locationAreaDisplayName(id, ref.name, lang);
    case "item-category":
      return itemCategoryDisplayName(id, ref.name, lang);
    case "move-damage-class":
      return moveDamageClassDisplayName(id, ref.name, lang);
  }
}
