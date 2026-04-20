import type { Locale } from "../../src/types/locales";
import type { TypeBundle, TypeIndexEntry } from "../../src/types/bundles";
import { readType, refIdSafe } from "./pokeapi";
import { pickName } from "./localize";
import { pokemonDisplayName } from "./name-cache";

export function buildTypeBundle(
  id: number,
  lang: Locale,
): { bundle: TypeBundle; indexEntry: TypeIndexEntry } | null {
  const raw = readType(id);
  if (!raw) return null;
  const displayName = pickName(raw.names, lang, raw.name);
  const generation = raw.generation?.name ?? "unknown";

  const pokemon = raw.pokemon.map((p) => {
    const pid = refIdSafe(p.pokemon) ?? 0;
    return {
      name: p.pokemon.name,
      display_name: pokemonDisplayName(pid, p.pokemon.name, lang),
      id: pid,
      slot: p.slot,
    };
  });

  const bundle: TypeBundle = {
    kind: "type",
    id: raw.id,
    name: raw.name,
    display_name: displayName,
    generation,
    relations: {
      double_damage_to: raw.damage_relations.double_damage_to.map((r) => r.name),
      half_damage_to: raw.damage_relations.half_damage_to.map((r) => r.name),
      no_damage_to: raw.damage_relations.no_damage_to.map((r) => r.name),
      double_damage_from: raw.damage_relations.double_damage_from.map((r) => r.name),
      half_damage_from: raw.damage_relations.half_damage_from.map((r) => r.name),
      no_damage_from: raw.damage_relations.no_damage_from.map((r) => r.name),
    },
    pokemon,
  };

  const indexEntry: TypeIndexEntry = {
    id: raw.id,
    name: raw.name,
    display_name: displayName,
    generation,
  };

  return { bundle, indexEntry };
}
