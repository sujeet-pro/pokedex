import type { Locale } from "../../src/types/locales";
import type { LocationIndexEntry } from "../../src/types/bundles";
import { readLocation, readLocationArea, refIdSafe } from "./pokeapi";
import { pickName } from "./localize";

export function buildLocationIndexEntry(
  id: number,
  lang: Locale,
): LocationIndexEntry | null {
  const raw = readLocation(id);
  if (!raw) return null;

  const displayName = pickName(raw.names, lang, raw.name);
  const region = raw.region?.name ?? "unknown";

  const areas = raw.areas.map((a) => {
    const aid = refIdSafe(a);
    let areaDisplay = a.name;
    if (aid != null) {
      const area = readLocationArea(aid);
      if (area) areaDisplay = pickName(area.names, lang, a.name);
    }
    return { name: a.name, display_name: areaDisplay };
  });

  return {
    id: raw.id,
    name: raw.name,
    display_name: displayName,
    region,
    area_count: areas.length,
    areas,
  };
}
