import type { Locale } from "../../src/types/locales";
import type { SpeciesBundle } from "../../src/types/bundles";
import { readSpeciesOrNull, refIdSafe } from "./pokeapi";
import { paragraphHtml, pickFlavor, pickGenus, pickName } from "./localize";
import { generationDisplayName, humanize, pokemonDisplayName } from "./name-cache";
import { slugFor, slugMapFor } from "./slug-cache";
import { slugify } from "./slugify";

export function buildSpeciesBundle(id: number, lang: Locale): SpeciesBundle | null {
  const sp = readSpeciesOrNull(id);
  if (!sp) return null;
  const displayName = pickName(sp.names, lang, sp.name);

  const varieties = sp.varieties.map((v) => {
    const vid = refIdSafe(v.pokemon) ?? 0;
    return {
      name: v.pokemon.name,
      slug: slugFor("pokemon", vid, v.pokemon.name, lang),
      display_name: pokemonDisplayName(vid, v.pokemon.name, lang),
      is_default: v.is_default,
    };
  });

  const generationName = sp.generation.name;
  const genId = refIdSafe(sp.generation);
  const generationDisplay =
    genId != null ? generationDisplayName(genId, generationName, lang) : humanize(generationName);

  const slug = slugify(displayName, sp.name);
  const slugs = slugMapFor("species", sp.id, sp.name);

  return {
    kind: "pokemon-species",
    id: sp.id,
    name: sp.name,
    slug,
    slugs,
    display_name: displayName,
    genus: pickGenus(sp.genera, lang),
    generation: generationName,
    generation_display: generationDisplay,
    color: sp.color?.name ?? "unknown",
    shape: sp.shape?.name ?? null,
    habitat: sp.habitat?.name ?? null,
    growth_rate: sp.growth_rate.name,
    egg_groups: sp.egg_groups.map((g) => g.name),
    capture_rate: sp.capture_rate,
    base_happiness: sp.base_happiness ?? 0,
    hatch_counter: sp.hatch_counter,
    is_legendary: sp.is_legendary,
    is_mythical: sp.is_mythical,
    is_baby: sp.is_baby,
    flavor_html: paragraphHtml(pickFlavor(sp.flavor_text_entries, lang)),
    varieties,
  };
}
