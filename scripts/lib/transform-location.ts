import type { Locale } from "../../src/types/locales";
import type { LocationIndexEntry } from "../../src/types/bundles";
import { readLocation, readLocationArea, refIdSafe } from "./pokeapi";
import { pickName } from "./localize";
import { humanize } from "./name-cache";
import { slugMapFor } from "./slug-cache";
import { slugify } from "./slugify";

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

  const slug = slugify(displayName, raw.name);
  const slugs = slugMapFor("location", raw.id, raw.name);

  return {
    id: raw.id,
    name: raw.name,
    slug,
    slugs,
    display_name: displayName,
    region,
    region_display: humanize(region),
    area_count: areas.length,
    areas,
  };
}
