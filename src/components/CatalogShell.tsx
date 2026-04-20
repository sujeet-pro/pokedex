import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import { ConsoleDevice } from "./ConsoleDevice";
import "~/styles/components/CatalogShell.css";

type Layout = "square" | "rows";

type Props<T> = {
  title: string;
  subtitleLabel: string;
  /** Optional short page heading (h1) shown above the filter row. Defaults to the subtitle. */
  heading?: string;
  /** Placeholder text for the filter input. */
  placeholder?: string;
  entries: T[];
  /** Returns true if `entry` matches `query` (lowercased). Query is "" when empty. */
  matches: (entry: T, query: string) => boolean;
  renderItem: (entry: T) => ReactNode;
  /** Optional extra filter controls rendered alongside the name filter. */
  toolbar?: ReactNode;
  /** Stable key for each rendered entry. */
  keyOf: (entry: T) => string;
  /** "square" (default) = compact grid; "rows" = wider horizontal cards. */
  layout?: Layout;
};

export function CatalogShell<T>({
  title,
  subtitleLabel,
  heading,
  placeholder = "Filter by name…",
  entries,
  matches,
  renderItem,
  toolbar,
  keyOf,
  layout = "square",
}: Props<T>) {
  const pageHeading = heading ?? title.replace(/^POKÉ DEX ·\s*/i, "");
  const [raw, setRaw] = useState("");
  const query = useDeferredValue(raw.trim().toLowerCase());

  const filtered = useMemo(
    () => (query ? entries.filter((e) => matches(e, query)) : entries),
    [entries, matches, query],
  );

  return (
    <ConsoleDevice title={title} subtitle={subtitleLabel} ariaLabel={title}>
      <div>
        <p className="hud-row">
          <b>CATALOG</b> · {entries.length} TOTAL
          {query && ` · FILTER "${query}" · ${filtered.length} MATCH`}
        </p>
        <h1 className="visually-hidden">{pageHeading}</h1>
        <div className="catalog-toolbar">
          <div className="catalog-toolbar__field catalog-toolbar__field--name">
            <label className="catalog-toolbar__label" htmlFor="catalog-name-filter">
              Name
            </label>
            <input
              id="catalog-name-filter"
              type="search"
              className="catalog-toolbar__input"
              placeholder={placeholder}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              aria-label={`Filter ${title} by name`}
            />
          </div>
          {toolbar}
        </div>

        <div style={{ marginTop: "1rem" }}>
          {filtered.length === 0 ? (
            <div className="error-state" role="status" aria-live="polite">
              <h2>&gt; No match for &ldquo;{query}&rdquo;</h2>
              <p>Try a different query.</p>
            </div>
          ) : (
            <ul className={layout === "rows" ? "catalog-grid--rows" : "grid-cards"}>
              {filtered.map((entry) => (
                <li key={keyOf(entry)}>{renderItem(entry)}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ConsoleDevice>
  );
}
