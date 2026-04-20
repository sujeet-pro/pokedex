import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import "~/styles/components/Combobox.css";

export type ComboboxOption = {
  value: string;
  label: string;
};

type Props = {
  label: string;
  options: ComboboxOption[];
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  /** Text shown for the empty-selection option. Defaults to "All". */
  allLabel?: string;
};

export function Combobox({
  label,
  options,
  value,
  onChange,
  placeholder = "Type to filter…",
  allLabel = "All",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  );
  const display = selected ? selected.label : allLabel;

  const entries = useMemo<ComboboxOption[]>(
    () => [{ value: "", label: allLabel }, ...options],
    [options, allLabel],
  );

  const filtered = useMemo<ComboboxOption[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [entries, query]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [filtered.length]);

  const openMenu = useCallback(() => {
    setOpen(true);
    setQuery("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const commit = useCallback(
    (option: ComboboxOption) => {
      onChange(option.value);
      setOpen(false);
      setQuery("");
    },
    [onChange],
  );

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(filtered.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const option = filtered[active];
      if (option) commit(option);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setQuery("");
    } else if (e.key === "Home") {
      setActive(0);
    } else if (e.key === "End") {
      setActive(filtered.length - 1);
    }
  }

  return (
    <div className="combobox" ref={rootRef}>
      <label className="combobox__label">{label}</label>
      <button
        type="button"
        className="combobox__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openMenu())}
      >
        <span className="combobox__value">{display}</span>
        <span aria-hidden="true" className="combobox__chevron">
          ▾
        </span>
      </button>
      {open && (
        <div className="combobox__shell">
          <input
            ref={inputRef}
            className="combobox__input"
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              filtered.length > 0 ? `${listboxId}-opt-${active}` : undefined
            }
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <ul id={listboxId} className="combobox__list" role="listbox" aria-label={label}>
            {filtered.length === 0 && (
              <li className="combobox__empty">No matches for &ldquo;{query}&rdquo;</li>
            )}
            {filtered.map((opt, i) => {
              const isActive = i === active;
              const isSelected = opt.value === value;
              return (
                <li
                  key={opt.value || "__all"}
                  id={`${listboxId}-opt-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  className={`combobox__option${
                    isActive ? " combobox__option--active" : ""
                  }${isSelected ? " combobox__option--selected" : ""}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commit(opt);
                  }}
                  onMouseEnter={() => setActive(i)}
                >
                  <span>{opt.label}</span>
                  {isSelected && (
                    <span aria-hidden="true" className="combobox__check">
                      ✓
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
