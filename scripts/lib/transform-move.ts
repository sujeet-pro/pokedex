import type { Locale } from "../../src/types/locales";
import type { MoveBundle, MoveIndexEntry } from "../../src/types/bundles";
import { readMove, refIdSafe } from "./pokeapi";
import { cleanFlavor, paragraphHtml, pickByLocale, pickEffect, pickName } from "./localize";
import { pokemonDisplayName } from "./name-cache";

export function buildMoveBundle(
  id: number,
  lang: Locale,
): { bundle: MoveBundle; indexEntry: MoveIndexEntry } | null {
  const raw = readMove(id);
  if (!raw) return null;

  const displayName = pickName(raw.names, lang, raw.name);
  const effect = pickEffect(raw.effect_entries, lang);
  const shortEffectHtml = effect ? paragraphHtml(effect.short_effect) : null;
  const effectHtml = effect ? paragraphHtml(effect.effect) : null;

  const flavor = pickByLocale(raw.flavor_text_entries, lang);
  const flavorHtml = flavor ? paragraphHtml(cleanFlavor(flavor.flavor_text)) : null;

  const learnedBy = raw.learned_by_pokemon.map((p) => {
    const pid = refIdSafe(p) ?? 0;
    return {
      name: p.name,
      display_name: pokemonDisplayName(pid, p.name, lang),
      id: pid,
    };
  });

  const bundle: MoveBundle = {
    kind: "move",
    id: raw.id,
    name: raw.name,
    display_name: displayName,
    type: raw.type?.name ?? "unknown",
    damage_class: raw.damage_class?.name ?? "unknown",
    power: raw.power,
    accuracy: raw.accuracy,
    pp: raw.pp,
    priority: raw.priority,
    target: raw.target?.name ?? "unknown",
    generation: raw.generation?.name ?? "unknown",
    short_effect_html: shortEffectHtml,
    effect_html: effectHtml,
    flavor_html: flavorHtml,
    learned_by: learnedBy,
  };

  const indexEntry: MoveIndexEntry = {
    id: raw.id,
    name: raw.name,
    display_name: displayName,
    type: bundle.type,
    damage_class: bundle.damage_class,
    power: raw.power,
    accuracy: raw.accuracy,
    pp: raw.pp,
  };

  return { bundle, indexEntry };
}
