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
  displayName: string,
  tag?: string,
): SearchIndexEntry {
  if (tag !== undefined) {
    return { kind, name, id, display_name: displayName, tag };
  }
  return { kind, name, id, display_name: displayName };
}
