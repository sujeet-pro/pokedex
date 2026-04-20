import type { Locale } from "../../src/types/locales";
import type { AbilityBundle, AbilityIndexEntry } from "../../src/types/bundles";
import { readAbility, refIdSafe } from "./pokeapi";
import { pickByLocale, pickEffect, pickName, paragraphHtml, cleanFlavor } from "./localize";
import { pokemonDisplayName } from "./name-cache";

export function buildAbilityBundle(
  id: number,
  lang: Locale,
): { bundle: AbilityBundle; indexEntry: AbilityIndexEntry } | null {
  const raw = readAbility(id);
  if (!raw) return null;

  const displayName = pickName(raw.names, lang, raw.name);
  const generation = raw.generation?.name ?? "unknown";

  const effect = pickEffect(raw.effect_entries, lang);
  const shortEffectHtml = effect ? paragraphHtml(effect.short_effect) : null;
  const effectHtml = effect ? paragraphHtml(effect.effect) : null;

  const flavor = pickByLocale(raw.flavor_text_entries, lang);
  const flavorHtml = flavor ? paragraphHtml(cleanFlavor(flavor.flavor_text)) : null;

  const pokemon = (raw.pokemon ?? []).map((p) => {
    const pid = refIdSafe(p.pokemon) ?? 0;
    return {
      name: p.pokemon.name,
      display_name: pokemonDisplayName(pid, p.pokemon.name, lang),
      id: pid,
      is_hidden: p.is_hidden,
    };
  });

  const bundle: AbilityBundle = {
    kind: "ability",
    id: raw.id,
    name: raw.name,
    display_name: displayName,
    generation,
    short_effect_html: shortEffectHtml,
    effect_html: effectHtml,
    flavor_html: flavorHtml,
    pokemon,
  };

  const indexEntry: AbilityIndexEntry = {
    id: raw.id,
    name: raw.name,
    display_name: displayName,
    generation,
  };

  return { bundle, indexEntry };
}
