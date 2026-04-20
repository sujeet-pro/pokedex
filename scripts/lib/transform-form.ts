import type { Locale } from "../../src/types/locales";
import type { FormBundle } from "../../src/types/bundles";
import { readPokemonForm, refIdSafe } from "./pokeapi";
import { pickName } from "./localize";
import { pokemonDisplayName, humanize } from "./name-cache";

export function buildFormBundle(id: number, lang: Locale): FormBundle | null {
  const raw = readPokemonForm(id);
  if (!raw) return null;

  // Display name: prefer `names`, else fall back to form_names, else pokemon display
  let displayName = pickName(raw.names, lang, "");
  if (!displayName) displayName = pickName(raw.form_names, lang, "");
  if (!displayName) displayName = humanize(raw.name);

  const pokeId = refIdSafe(raw.pokemon) ?? 0;
  const pokemonBlock = {
    name: raw.pokemon.name,
    display_name: pokemonDisplayName(pokeId, raw.pokemon.name, lang),
    id: pokeId,
  };

  return {
    kind: "pokemon-form",
    id: raw.id,
    name: raw.name,
    display_name: displayName,
    form_name: raw.form_name ?? "",
    is_default: raw.is_default,
    is_mega: raw.is_mega,
    is_battle_only: raw.is_battle_only,
    types: raw.types
      .slice()
      .sort((a, b) => a.slot - b.slot)
      .map((t) => t.type.name),
    pokemon: pokemonBlock,
    version_group: raw.version_group?.name ?? "unknown",
    sprite: raw.sprites?.front_default ?? null,
  };
}
