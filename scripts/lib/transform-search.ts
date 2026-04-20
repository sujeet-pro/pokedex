import type { SearchIndexEntry } from "../../src/types/bundles";

export type KindForSearch =
  | "pokemon"
  | "type"
  | "ability"
  | "berry"
  | "item"
  | "move"
  | "location"
  | "generation";

export function makeSearchEntry(
  kind: KindForSearch,
  id: number,
  name: string,
  slug: string,
  displayName: string,
  tag?: string,
): SearchIndexEntry {
  if (tag !== undefined) {
    return { kind, id, name, slug, display_name: displayName, tag };
  }
  return { kind, id, name, slug, display_name: displayName };
}
