import type { Locale } from "../../src/types/locales";
import type { AbilityBundle, AbilityIndexEntry } from "../../src/types/bundles";
import { readAbility, refIdSafe } from "./pokeapi";
import { pickByLocale, pickEffect, pickName, paragraphHtml, cleanFlavor } from "./localize";
import { generationDisplayName, pokemonDisplayName } from "./name-cache";
import { slugFor, slugMapFor } from "./slug-cache";
import { slugify } from "./slugify";

export function buildAbilityBundle(
  id: number,
  lang: Locale,
): { bundle: AbilityBundle; indexEntry: AbilityIndexEntry } | null {
  const raw = readAbility(id);
  if (!raw) return null;

  const displayName = pickName(raw.names, lang, raw.name);
  const generation = raw.generation?.name ?? "unknown";
  const genId = raw.generation ? refIdSafe(raw.generation) : null;
  const generationDisplay =
    genId != null ? generationDisplayName(genId, generation, lang) : generation;

  const effect = pickEffect(raw.effect_entries, lang);
  const shortEffectHtml = effect ? paragraphHtml(effect.short_effect) : null;
  const effectHtml = effect ? paragraphHtml(effect.effect) : null;

  const flavor = pickByLocale(raw.flavor_text_entries, lang);
  const flavorHtml = flavor ? paragraphHtml(cleanFlavor(flavor.flavor_text)) : null;

  const pokemon = (raw.pokemon ?? []).map((p) => {
    const pid = refIdSafe(p.pokemon) ?? 0;
    return {
      name: p.pokemon.name,
      slug: slugFor("pokemon", pid, p.pokemon.name, lang),
      display_name: pokemonDisplayName(pid, p.pokemon.name, lang),
      id: pid,
      is_hidden: p.is_hidden,
    };
  });

  const slug = slugify(displayName, raw.name);
  const slugs = slugMapFor("ability", raw.id, raw.name);

  const bundle: AbilityBundle = {
    kind: "ability",
    id: raw.id,
    name: raw.name,
    slug,
    slugs,
    display_name: displayName,
    generation,
    generation_display: generationDisplay,
    short_effect_html: shortEffectHtml,
    effect_html: effectHtml,
    flavor_html: flavorHtml,
    pokemon,
  };

  const indexEntry: AbilityIndexEntry = {
    id: raw.id,
    name: raw.name,
    slug,
    slugs,
    display_name: displayName,
    generation,
  };

  return { bundle, indexEntry };
}
