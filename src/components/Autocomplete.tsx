import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { searchIndexQuery } from "~/api/queries";
import { useDebounced } from "~/hooks/useDebounced";
import type { SearchEntry, SearchKind } from "~/types/bundles";

type Props = {
  placeholder?: string;
  /** Optional glyph rendered on the right side of the input — e.g. "⌘" or "Ctrl". */
  kbdHint?: string;
};

const KIND_LABELS: Record<SearchKind, string> = {
  pokemon: "Pokémon",
  type: "Type",
  ability: "Ability",
  species: "Species",
  form: "Form",
  berry: "Berry",
  item: "Item",
  location: "Location",
  move: "Move",
  generation: "Generation",
};

function pathForEntry(entry: SearchEntry): string {
  switch (entry.kind) {
    case "pokemon":
      return `/pokemon/${entry.name}`;
    case "type":
      return `/type/${entry.name}`;
    case "ability":
      return `/ability/${entry.name}`;
    case "species":
      return `/pokemon-species/${entry.name}`;
    case "form":
      return `/pokemon-form/${entry.name}`;
    case "berry":
      return `/berry/${entry.name}`;
    case "item":
      return `/item/${entry.name}`;
    case "location":
      return `/locations#${entry.name}`;
    case "move":
      return `/move/${entry.name}`;
    case "generation":
      return `/generations#${entry.name}`;
  }
}

// Display priority when matches are equal — pokemon first, then core resources, then everything else.
const KIND_PRIORITY: Record<SearchKind, number> = {
  pokemon: 0,
  move: 1,
  ability: 2,
  item: 3,
  berry: 4,
  type: 5,
  location: 6,
  generation: 7,
  species: 8,
  form: 9,
};

// Union of rows rendered in the dropdown. The first row is always a "see all
// results for <query>" escape hatch, so a user can always commit their literal
// query string and see every hit on the Search page.
type Row =
  | { kind: "all"; query: string }
  | { kind: "entry"; entry: SearchEntry };

export function Autocomplete({ placeholder = "Search everything…", kbdHint }: Props) {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const debounced = useDebounced(value.trim().toLowerCase(), 120);

  const { data } = useQuery(searchIndexQuery());

  const rows = useMemo<Row[]>(() => {
    if (!debounced) return [];
    const hits: { entry: SearchEntry; score: number }[] = [];
    if (data) {
      for (const entry of data.entries) {
        const n = entry.name.toLowerCase();
        const d = entry.display_name.toLowerCase();
        let score: number | null = null;
        if (n === debounced || d === debounced) score = 0;
        else if (n.startsWith(debounced) || d.startsWith(debounced)) score = 1;
        else if (n.includes(debounced) || d.includes(debounced)) score = 2;
        if (score !== null) hits.push({ entry, score });
      }
      hits.sort((a, b) => {
        if (a.score !== b.score) return a.score - b.score;
        const p = KIND_PRIORITY[a.entry.kind] - KIND_PRIORITY[b.entry.kind];
        if (p !== 0) return p;
        return a.entry.display_name.localeCompare(b.entry.display_name);
      });
    }
    return [
      { kind: "all", query: debounced } as const,
      ...hits.slice(0, 9).map((h) => ({ kind: "entry", entry: h.entry }) as const),
    ];
  }, [debounced, data]);

  useEffect(() => {
    // Keep highlight on the "see all" row by default so Enter ends up at /search.
    setActive(0);
  }, [rows]);

  const submitQuery = useCallback(
    (query: string) => {
      const q = query.trim();
      if (!q) return;
      setValue("");
      setOpen(false);
      navigate({ to: "/search", search: { q } });
    },
    [navigate],
  );

  const pickEntry = useCallback(
    (entry: SearchEntry) => {
      setValue("");
      setOpen(false);
      navigate({ to: pathForEntry(entry) });
    },
    [navigate],
  );

  const pickRow = useCallback(
    (row: Row) => {
      if (row.kind === "all") submitQuery(row.query);
      else pickEntry(row.entry);
    },
    [pickEntry, submitQuery],
  );

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || rows.length === 0) {
      if (e.key === "Enter") submitQuery(value);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % rows.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + rows.length) % rows.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const chosen = rows[active];
      if (chosen) pickRow(chosen);
      else submitQuery(value);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <form
      className="search"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const chosen = rows[active];
        if (open && chosen) pickRow(chosen);
        else submitQuery(value);
      }}
    >
      <label htmlFor="global-search" className="visually-hidden">
        Search everything by name
      </label>
      <input
        id="global-search"
        ref={inputRef}
        className={`search__input${kbdHint ? " search__input--has-kbd" : ""}`}
        type="search"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={open && rows.length > 0}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && rows.length > 0 ? `${listboxId}-opt-${active}` : undefined
        }
      />
      {kbdHint && (
        <kbd className="search__kbd" aria-hidden="true">
          <span>{kbdHint}</span>
          <span>K</span>
        </kbd>
      )}
      {open && rows.length > 0 && (
        <ul
          className="search__menu"
          id={listboxId}
          role="listbox"
          aria-label="Search suggestions"
        >
          {rows.map((row, i) => (
            <li
              key={row.kind === "all" ? `__all:${row.query}` : `${row.entry.kind}:${row.entry.name}`}
              role="option"
              aria-selected={i === active}
            >
              <button
                type="button"
                id={`${listboxId}-opt-${i}`}
                className={`search__option ${i === active ? "search__option--active" : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pickRow(row);
                }}
                onMouseEnter={() => setActive(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                }}
              >
                {row.kind === "all" ? (
                  <>
                    <span>
                      <span aria-hidden="true" style={{ marginRight: "0.4rem" }}>
                        ⌕
                      </span>
                      See all results for &ldquo;{row.query}&rdquo;
                    </span>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        letterSpacing: "0.08em",
                        color: "var(--amber)",
                        textTransform: "uppercase",
                      }}
                    >
                      Search
                    </span>
                  </>
                ) : (
                  <>
                    <span>{row.entry.display_name}</span>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        letterSpacing: "0.08em",
                        color: "var(--phosphor-dim)",
                        textTransform: "uppercase",
                      }}
                    >
                      {KIND_LABELS[row.entry.kind]}
                    </span>
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
