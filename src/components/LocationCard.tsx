import { useState } from "react";
import type { LocationIndexEntry } from "~/types/bundles";

type Props = {
  entry: LocationIndexEntry;
};

/**
 * Expandable location card. Click (or keyboard activation) toggles
 * `aria-expanded` and reveals the inline area list. Falls back to
 * `.pokemon-card` as its visual base since there is no dedicated
 * `.location-card` scope in console.css yet.
 */
export function LocationCard({ entry }: Props) {
  const [open, setOpen] = useState(false);
  const hasAreas = entry.areas.length > 0;

  return (
    <article className="pokemon-card" data-open={open ? "true" : "false"}>
      <button
        type="button"
        className="pokemon-card__name"
        aria-expanded={open}
        aria-controls={`loc-${entry.id}-areas`}
        disabled={!hasAreas}
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "transparent",
          padding: 0,
          width: "100%",
          textAlign: "left",
          cursor: hasAreas ? "pointer" : "default",
        }}
      >
        {entry.display_name}
      </button>
      <div className="pokemon-card__id">{entry.region.toUpperCase()}</div>
      <div className="pokemon-card__id">
        {entry.area_count} area{entry.area_count === 1 ? "" : "s"}
      </div>
      {open && hasAreas ? (
        <ul
          id={`loc-${entry.id}-areas`}
          className="pill-list"
          aria-label={`${entry.display_name} areas`}
          style={{ justifyContent: "center", marginTop: ".5rem" }}
        >
          {entry.areas.map((area) => (
            <li key={area.name}>
              <span className="pill">{area.display_name}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
