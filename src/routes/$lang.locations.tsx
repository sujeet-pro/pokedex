import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { locationIndexQuery } from "~/lib/queries";
import { CatalogShell } from "~/components/CatalogShell";
import { LocationCard } from "~/components/LocationCard";
import { FilterBar, NameFilter, SingleFilter } from "~/components/FilterBar";
import { titleCase } from "~/lib/formatters";
import type { LocationIndexEntry } from "~/types/bundles";

export const Route = createFileRoute("/$lang/locations")({
  loader: async ({ context, params }) => {
    if (!isLocale(params.lang)) return;
    await context.queryClient.ensureQueryData(locationIndexQuery(params.lang));
  },
  component: LocationListPage,
  head: ({ params }) => ({ meta: [{ title: `Locations · ${params.lang}` }] }),
});

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function LocationListPage() {
  const { lang } = Route.useParams();
  if (!isLocale(lang)) return null;
  const { data } = useSuspenseQuery(locationIndexQuery(lang));

  const [name, setName] = useState("");
  const [region, setRegion] = useState<string | null>(null);

  const regionOptions = useMemo(
    () =>
      Array.from(new Set(data.entries.map((e) => e.region)))
        .filter(Boolean)
        .sort()
        .map((value) => ({ value, label: titleCase(value) })),
    [data.entries],
  );

  const filtered = useMemo(() => {
    const q = name.trim();
    const needle = q ? normalize(q) : "";
    return data.entries.filter((e) => {
      if (needle && !normalize(e.display_name).includes(needle) && !normalize(e.name).includes(needle)) {
        return false;
      }
      if (region && e.region !== region) return false;
      return true;
    });
  }, [data.entries, name, region]);

  // Group filtered entries by region, preserving order of first appearance.
  const grouped = useMemo(() => {
    const byRegion = new Map<string, LocationIndexEntry[]>();
    for (const entry of filtered) {
      const key = entry.region || "other";
      const list = byRegion.get(key) ?? [];
      list.push(entry);
      byRegion.set(key, list);
    }
    return Array.from(byRegion.entries());
  }, [filtered]);

  const anyActive = name || region;
  const clearAll = () => {
    setName("");
    setRegion(null);
  };

  return (
    <CatalogShell title="Locations" lede="Regions and areas." count={data.total}>
      <FilterBar>
        <NameFilter
          value={name}
          onChange={setName}
          placeholder={lang === "fr" ? "Filtrer par nom…" : "Filter by name…"}
        />
        <SingleFilter
          label={lang === "fr" ? "Région" : "Region"}
          options={regionOptions}
          value={region}
          onChange={setRegion}
        />
        {anyActive ? (
          <button type="button" className="pill-button" onClick={clearAll}>
            {lang === "fr" ? "Effacer" : "Clear"}
          </button>
        ) : null}
      </FilterBar>

      <div className="filter-summary">
        <span>
          {filtered.length} / {data.total}
        </span>
      </div>

      {grouped.length > 0 ? (
        grouped.map(([r, entries]) => (
          <div key={r} className="panel">
            <div className="panel__title">{r.toUpperCase()} · {entries.length}</div>
            <ul className="grid-cards" aria-label={`${r} locations`}>
              {entries.map((entry) => (
                <li key={entry.name}>
                  <LocationCard entry={entry} />
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <div className="filter-empty">
          {lang === "fr" ? "Aucun résultat. Ajustez les filtres." : "No results. Adjust filters."}
        </div>
      )}
    </CatalogShell>
  );
}
