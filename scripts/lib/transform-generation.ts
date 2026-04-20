import type { Locale } from "../../src/types/locales";
import type { GenerationBundle, GenerationIndexEntry } from "../../src/types/bundles";
import { readGeneration, refIdSafe } from "./pokeapi";
import { pickName } from "./localize";
import {
  abilityDisplayName,
  moveDisplayName,
  speciesDisplayName,
  typeDisplayName,
} from "./name-cache";

export function buildGenerationBundle(
  id: number,
  lang: Locale,
): { bundle: GenerationBundle; indexEntry: GenerationIndexEntry } | null {
  const raw = readGeneration(id);
  if (!raw) return null;

  const displayName = pickName(raw.names, lang, raw.name);
  const mainRegion = raw.main_region?.name ?? "unknown";

  const species = raw.pokemon_species.map((s) => {
    const sid = refIdSafe(s) ?? 0;
    return {
      name: s.name,
      display_name: speciesDisplayName(sid, s.name, lang),
      id: sid,
    };
  });

  const moves = raw.moves.map((m) => {
    const mid = refIdSafe(m) ?? 0;
    return { name: m.name, display_name: moveDisplayName(mid, m.name, lang) };
  });

  const abilities = raw.abilities.map((a) => {
    const aid = refIdSafe(a) ?? 0;
    return { name: a.name, display_name: abilityDisplayName(aid, a.name, lang) };
  });

  const types = raw.types.map((t) => {
    const tid = refIdSafe(t) ?? 0;
    return { name: t.name, display_name: typeDisplayName(tid, t.name, lang) };
  });

  const bundle: GenerationBundle = {
    kind: "generation",
    id: raw.id,
    name: raw.name,
    display_name: displayName,
    main_region: mainRegion,
    version_groups: raw.version_groups.map((v) => v.name),
    counts: {
      species: species.length,
      moves: moves.length,
      abilities: abilities.length,
      types: types.length,
    },
    species,
    moves,
    abilities,
    types,
  };

  const indexEntry: GenerationIndexEntry = {
    id: raw.id,
    name: raw.name,
    display_name: displayName,
    main_region: mainRegion,
    species_count: species.length,
  };

  return { bundle, indexEntry };
}
