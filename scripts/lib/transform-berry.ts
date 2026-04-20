import type { Locale } from "../../src/types/locales";
import type { BerryBundle, BerryIndexEntry } from "../../src/types/bundles";
import { readBerry, readItem, refIdSafe } from "./pokeapi";
import { pickName } from "./localize";
import { humanize } from "./name-cache";

export function buildBerryBundle(
  id: number,
  lang: Locale,
): { bundle: BerryBundle; indexEntry: BerryIndexEntry } | null {
  const raw = readBerry(id);
  if (!raw) return null;

  // Localized display name comes from the associated item (berries have no names field)
  const itemId = refIdSafe(raw.item);
  let displayName = humanize(raw.name);
  let itemDisplayName = humanize(raw.item.name);
  if (itemId != null) {
    const item = readItem(itemId);
    if (item) {
      itemDisplayName = pickName(item.names, lang, humanize(raw.item.name));
      displayName = itemDisplayName;
    }
  }

  const bundle: BerryBundle = {
    kind: "berry",
    id: raw.id,
    name: raw.name,
    display_name: displayName,
    firmness: raw.firmness.name,
    growth_time: raw.growth_time,
    max_harvest: raw.max_harvest,
    size: raw.size,
    smoothness: raw.smoothness,
    soil_dryness: raw.soil_dryness,
    natural_gift_power: raw.natural_gift_power,
    natural_gift_type: raw.natural_gift_type.name,
    flavors: raw.flavors.map((f) => ({ name: f.flavor.name, potency: f.potency })),
    item: { name: raw.item.name, display_name: itemDisplayName },
  };

  const indexEntry: BerryIndexEntry = {
    id: raw.id,
    name: raw.name,
    display_name: displayName,
    firmness: raw.firmness.name,
    natural_gift_type: raw.natural_gift_type.name,
  };

  return { bundle, indexEntry };
}
