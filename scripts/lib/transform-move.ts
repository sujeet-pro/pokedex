import type { Locale } from "../../src/types/locales";
import type { MoveBundle, MoveIndexEntry } from "../../src/types/bundles";
import { readMove, refIdSafe } from "./pokeapi";
import { cleanFlavor, paragraphHtml, pickByLocale, pickEffect, pickName } from "./localize";
import { moveDamageClassDisplayName, pokemonDisplayName, typeDisplayName } from "./name-cache";
import { slugFor, slugMapFor } from "./slug-cache";
import { slugify } from "./slugify";

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
      slug: slugFor("pokemon", pid, p.name, lang),
      display_name: pokemonDisplayName(pid, p.name, lang),
      id: pid,
    };
  });

  const typeName = raw.type?.name ?? "unknown";
  const typeId = raw.type ? refIdSafe(raw.type) : null;
  const typeSlug = typeId != null ? slugFor("type", typeId, typeName, lang) : typeName;
  const typeDisplay = typeId != null ? typeDisplayName(typeId, typeName, lang) : typeName;

  const dmgClass = raw.damage_class?.name ?? "unknown";
  const dmgClassId = raw.damage_class ? refIdSafe(raw.damage_class) : null;
  const dmgClassDisplay =
    dmgClassId != null ? moveDamageClassDisplayName(dmgClassId, dmgClass, lang) : dmgClass;

  const slug = slugify(displayName, raw.name);
  const slugs = slugMapFor("move", raw.id, raw.name);

  const bundle: MoveBundle = {
    kind: "move",
    id: raw.id,
    name: raw.name,
    slug,
    slugs,
    display_name: displayName,
    type: typeName,
    type_slug: typeSlug,
    type_display: typeDisplay,
    damage_class: dmgClass,
    damage_class_display: dmgClassDisplay,
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
    slug,
    slugs,
    display_name: displayName,
    type: typeName,
    damage_class: dmgClass,
    power: raw.power,
    accuracy: raw.accuracy,
    pp: raw.pp,
  };

  return { bundle, indexEntry };
}
