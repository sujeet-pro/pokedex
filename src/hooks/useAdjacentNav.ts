import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useHotkey } from "@tanstack/react-hotkeys";

type Entry = { name: string };

/**
 * Wires the "[" and "]" keys to navigate to the previous / next entry within
 * the current resource's ordered index. Silent no-op when the current entry
 * can't be located (e.g. while the index query is still pending).
 */
export function useAdjacentNav(
  entries: Entry[] | undefined,
  currentName: string,
  resourcePath: string,
) {
  const navigate = useNavigate();

  const { prev, next } = useMemo(() => {
    if (!entries) return { prev: null, next: null };
    const idx = entries.findIndex((e) => e.name === currentName);
    if (idx < 0) return { prev: null, next: null };
    return {
      prev: idx > 0 ? entries[idx - 1]!.name : null,
      next: idx < entries.length - 1 ? entries[idx + 1]!.name : null,
    };
  }, [entries, currentName]);

  useHotkey("[", (e) => {
    if (!prev) return;
    e.preventDefault();
    navigate({ to: `${resourcePath}/${prev}` });
  });
  useHotkey("]", (e) => {
    if (!next) return;
    e.preventDefault();
    navigate({ to: `${resourcePath}/${next}` });
  });

  return { prev, next };
}
