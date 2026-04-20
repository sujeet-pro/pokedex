import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listPokemonQuery } from "~/api/queries";
import { useDebounced } from "~/hooks/useDebounced";
import { titleCase } from "~/utils/formatters";

export function Autocomplete({ placeholder = "Search Pokémon…" }: { placeholder?: string }) {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const debounced = useDebounced(value.trim().toLowerCase(), 120);

  const { data } = useQuery(listPokemonQuery());

  const suggestions = useMemo(() => {
    if (!debounced || !data) return [];
    return data.results.filter((r) => r.name.includes(debounced)).slice(0, 8);
  }, [debounced, data]);

  useEffect(() => {
    setActive(0);
  }, [suggestions]);

  const submit = useCallback(
    (query: string) => {
      const q = query.trim();
      if (!q) return;
      setOpen(false);
      navigate({ to: "/search", search: { q } });
    },
    [navigate],
  );

  const pickSuggestion = useCallback(
    (name: string) => {
      setValue("");
      setOpen(false);
      navigate({ to: "/pokemon/$name", params: { name } });
    },
    [navigate],
  );

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      if (e.key === "Enter") submit(value);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const chosen = suggestions[active];
      if (chosen) pickSuggestion(chosen.name);
      else submit(value);
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
        const chosen = suggestions[active];
        if (open && chosen) pickSuggestion(chosen.name);
        else submit(value);
      }}
    >
      <label htmlFor="global-search" className="visually-hidden">
        Search Pokémon by name
      </label>
      <input
        id="global-search"
        ref={inputRef}
        className="search__input"
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
        aria-expanded={open && suggestions.length > 0}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && suggestions.length > 0 ? `${listboxId}-opt-${active}` : undefined
        }
      />
      {open && suggestions.length > 0 && (
        <ul className="search__menu" id={listboxId} role="listbox" aria-label="Pokémon suggestions">
          {suggestions.map((s, i) => (
            <li key={s.name} role="option" aria-selected={i === active}>
              <button
                type="button"
                id={`${listboxId}-opt-${i}`}
                className={`search__option ${i === active ? "search__option--active" : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pickSuggestion(s.name);
                }}
                onMouseEnter={() => setActive(i)}
              >
                {titleCase(s.name)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
