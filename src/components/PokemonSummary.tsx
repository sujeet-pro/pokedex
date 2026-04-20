import { Suspense, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { pokemonSummaryQuery } from "~/api/queries";

type Props = {
  /** Numeric dex id — summary lives at `bundles/summary/<id>_en.txt`. */
  id: number;
  /** True if `bundles/summary/<id>_en.txt` exists. */
  available: boolean;
};

export function PokemonSummary({ id, available }: Props) {
  const [open, setOpen] = useState(false);

  if (!available) return null;

  return (
    <div className="hud-card" style={{ marginTop: "1rem" }}>
      <div className="hud-card__title">
        <span>Narrated entry</span>
        <button
          type="button"
          className="pill-button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={`pokemon-summary-${id}`}
        >
          {open ? "Close" : "Read"}
        </button>
      </div>
      {open && (
        <div id={`pokemon-summary-${id}`} style={{ marginTop: "0.5rem" }}>
          <Suspense
            fallback={
              <div className="skeleton" aria-busy="true" style={{ height: "6rem" }} />
            }
          >
            <SummaryBody id={id} />
          </Suspense>
        </div>
      )}
    </div>
  );
}

function SummaryBody({ id }: { id: number }) {
  const { data } = useSuspenseQuery(pokemonSummaryQuery(id));
  const paragraphs = data.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <div style={{ display: "grid", gap: "0.6rem" }}>
      {paragraphs.map((p, i) => (
        <p
          key={i}
          style={{
            margin: 0,
            color: "var(--screen-fg-dim)",
            fontSize: "0.95rem",
            lineHeight: 1.65,
          }}
        >
          {p}
        </p>
      ))}
    </div>
  );
}
