import { Suspense, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { itemIndexQuery } from "~/api/queries";
import { CatalogShell } from "~/components/CatalogShell";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { PillFilter } from "~/components/PillFilter";
import { titleCase } from "~/utils/formatters";

function ItemGrid() {
  const { data } = useSuspenseQuery(itemIndexQuery());
  const [category, setCategory] = useState("");

  const categoryOptions = useMemo(() => {
    const s = new Set<string>();
    for (const e of data.entries) s.add(e.category);
    return [...s].sort().map((c) => ({ value: c, label: titleCase(c) }));
  }, [data.entries]);

  const filtered = useMemo(
    () => (category ? data.entries.filter((e) => e.category === category) : data.entries),
    [data.entries, category],
  );

  return (
    <CatalogShell
      title="POKÉ DEX · ITEMS"
      subtitleLabel={`${data.total} items`}
      placeholder="Filter items…"
      entries={filtered}
      keyOf={(e) => e.name}
      matches={(e, q) => e.name.includes(q) || e.display_name.toLowerCase().includes(q)}
      toolbar={
        <PillFilter
          label="Category"
          options={categoryOptions}
          value={category}
          onChange={setCategory}
        />
      }
      layout="rows"
      renderItem={(e) => (
        <Link
          to="/item/$name"
          params={{ name: e.name }}
          className="catalog-row"
          aria-label={`${e.display_name} — ${titleCase(e.category)}`}
        >
          <div className="catalog-row__sprite catalog-row__sprite--pixelated">
            {e.sprite ? (
              <img src={e.sprite} alt="" loading="lazy" decoding="async" />
            ) : (
              <div
                aria-hidden="true"
                style={{
                  color: "var(--phosphor-dim)",
                  fontSize: "0.85rem",
                  fontFamily: "var(--font-mono)",
                }}
              >
                —
              </div>
            )}
          </div>
          <div className="catalog-row__body">
            <div className="catalog-row__id">#{String(e.id).padStart(4, "0")}</div>
            <p className="catalog-row__name">{e.display_name}</p>
            <div className="catalog-row__meta">
              <span className="catalog-row__tag">{titleCase(e.category)}</span>
              {e.cost > 0 && <span className="catalog-row__tag">₽{e.cost}</span>}
            </div>
          </div>
        </Link>
      )}
    />
  );
}

export function ItemListPage() {
  return (
    <Suspense
      fallback={
        <ConsoleDevice title="POKÉ DEX · ITEMS" subtitle="loading" ariaLabel="Loading items">
          <div className="skeleton" style={{ height: "20rem" }} />
        </ConsoleDevice>
      }
    >
      <ItemGrid />
    </Suspense>
  );
}
