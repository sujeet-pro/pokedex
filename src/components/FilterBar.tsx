import { DropdownMenu } from "radix-ui";
import type { ReactNode } from "react";

export type FilterOption = { value: string; label: string; tag?: string };

type MultiProps = {
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
};

/** Compact multi-select dropdown (Radix DropdownMenu + CheckboxItem). */
export function MultiFilter({ label, options, selected, onChange }: MultiProps) {
  const active = selected.length > 0;
  const toggle = (value: string) => {
    if (selected.includes(value)) onChange(selected.filter((v) => v !== value));
    else onChange([...selected, value]);
  };
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="pill-button"
          aria-pressed={active}
          aria-label={label}
        >
          {label}
          {active ? <span style={{ marginLeft: ".35rem" }}>· {selected.length}</span> : null}
          <span aria-hidden style={{ marginLeft: ".25rem" }}>▾</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="filter-menu"
          align="start"
          sideOffset={6}
          aria-label={label}
        >
          <div className="filter-menu__body">
            {options.map((opt) => {
              const checked = selected.includes(opt.value);
              return (
                <DropdownMenu.CheckboxItem
                  key={opt.value}
                  checked={checked}
                  onCheckedChange={() => toggle(opt.value)}
                  onSelect={(e) => e.preventDefault()}
                  className="filter-menu__item"
                >
                  <span className="filter-menu__check" aria-hidden>
                    {checked ? "✓" : ""}
                  </span>
                  <span className="filter-menu__label">{opt.label}</span>
                  {opt.tag ? <span className="filter-menu__tag">{opt.tag}</span> : null}
                </DropdownMenu.CheckboxItem>
              );
            })}
          </div>
          {active ? (
            <div className="filter-menu__foot">
              <button
                type="button"
                className="pill-button filter-menu__clear"
                onClick={() => onChange([])}
              >
                Clear
              </button>
            </div>
          ) : null}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

type SingleProps = {
  label: string;
  options: FilterOption[];
  value: string | null;
  onChange: (next: string | null) => void;
  allLabel?: string;
};

/** Single-select dropdown with an "Any" option. */
export function SingleFilter({ label, options, value, onChange, allLabel = "Any" }: SingleProps) {
  const active = value !== null;
  const current = options.find((o) => o.value === value);
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="pill-button"
          aria-pressed={active}
          aria-label={label}
        >
          {label}
          {active && current ? <span style={{ marginLeft: ".35rem" }}>· {current.label}</span> : null}
          <span aria-hidden style={{ marginLeft: ".25rem" }}>▾</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="filter-menu" align="start" sideOffset={6} aria-label={label}>
          <DropdownMenu.RadioGroup
            value={value ?? ""}
            onValueChange={(v) => onChange(v === "" ? null : v)}
          >
            <DropdownMenu.RadioItem
              value=""
              onSelect={(e) => e.preventDefault()}
              className="filter-menu__item"
            >
              <span className="filter-menu__check" aria-hidden>{value === null ? "✓" : ""}</span>
              <span className="filter-menu__label">{allLabel}</span>
            </DropdownMenu.RadioItem>
            {options.map((opt) => (
              <DropdownMenu.RadioItem
                key={opt.value}
                value={opt.value}
                onSelect={(e) => e.preventDefault()}
                className="filter-menu__item"
              >
                <span className="filter-menu__check" aria-hidden>
                  {value === opt.value ? "✓" : ""}
                </span>
                <span className="filter-menu__label">{opt.label}</span>
                {opt.tag ? <span className="filter-menu__tag">{opt.tag}</span> : null}
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

type NameProps = {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
};

export function NameFilter({ value, onChange, placeholder }: NameProps) {
  return (
    <div className="search" style={{ flex: "1 1 240px", minWidth: 0 }}>
      <input
        type="search"
        className="search__input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        aria-label={placeholder}
      />
    </div>
  );
}

type BarProps = {
  children: ReactNode;
};

export function FilterBar({ children }: BarProps) {
  return <div className="filter-bar">{children}</div>;
}
