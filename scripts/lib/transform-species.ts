import type { Locale } from "../../src/types/locales";
import type { SpeciesBundle } from "../../src/types/bundles";
import { readSpeciesOrNull } from "./pokeapi";
import { paragraphHtml, pickFlavor, pickGenus, pickName } from "./localize";

export function buildSpeciesBundle(id: number, lang: Locale): SpeciesBundle | null {
  const sp = readSpeciesOrNull(id);
  if (!sp) return null;
  const displayName = pickName(sp.names, lang, sp.name);

  const varieties = sp.varieties.map((v) => ({
    name: v.pokemon.name,
    display_name: v.pokemon.name,
    is_default: v.is_default,
  }));

  return {
    kind: "pokemon-species",
    id: sp.id,
    name: sp.name,
    display_name: displayName,
    genus: pickGenus(sp.genera, lang),
    generation: sp.generation.name,
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
