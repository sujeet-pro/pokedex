import type { Locale } from "../../src/types/locales";
import type { ItemBundle, ItemIndexEntry } from "../../src/types/bundles";
import { readItem, refIdSafe } from "./pokeapi";
import { cleanFlavor, paragraphHtml, pickByLocale, pickEffect, pickName } from "./localize";
import { itemCategoryDisplayName, pokemonDisplayName } from "./name-cache";

export function buildItemBundle(
  id: number,
  lang: Locale,
): { bundle: ItemBundle; indexEntry: ItemIndexEntry } | null {
  const raw = readItem(id);
  if (!raw) return null;

  const displayName = pickName(raw.names, lang, raw.name);

  const effect = pickEffect(raw.effect_entries, lang);
  const shortEffectHtml = effect ? paragraphHtml(effect.short_effect) : null;
  const effectHtml = effect ? paragraphHtml(effect.effect) : null;

  const flavor = pickByLocale(raw.flavor_text_entries, lang);
  const flavorHtml = flavor ? paragraphHtml(cleanFlavor(flavor.text)) : null;

  const categoryId = refIdSafe(raw.category) ?? 0;
  const categoryDisplay = itemCategoryDisplayName(categoryId, raw.category.name, lang);

  const heldBy = raw.held_by_pokemon.map((h) => {
    const pid = refIdSafe(h.pokemon) ?? 0;
    return {
      name: h.pokemon.name,
      display_name: pokemonDisplayName(pid, h.pokemon.name, lang),
      id: pid,
    };
  });

  const bundle: ItemBundle = {
    kind: "item",
    id: raw.id,
    name: raw.name,
    display_name: displayName,
    cost: raw.cost,
    category: raw.category.name,
    category_display: categoryDisplay,
    attributes: raw.attributes.map((a) => a.name),
    fling_power: raw.fling_power,
    fling_effect: raw.fling_effect?.name ?? null,
    short_effect_html: shortEffectHtml,
    effect_html: effectHtml,
    flavor_html: flavorHtml,
    sprite: raw.sprites?.default ?? null,
    held_by: heldBy,
  };

  const indexEntry: ItemIndexEntry = {
    id: raw.id,
    name: raw.name,
    display_name: displayName,
    category: raw.category.name,
    cost: raw.cost,
  };

  return { bundle, indexEntry };
}
