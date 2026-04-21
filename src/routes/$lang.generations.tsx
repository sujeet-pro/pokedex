import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { generationIndexQuery } from "~/lib/queries";
import { CatalogShell } from "~/components/CatalogShell";
import { FilterBar, NameFilter } from "~/components/FilterBar";

export const Route = createFileRoute("/$lang/generations")({
  loader: async ({ context, params }) => {
    if (!isLocale(params.lang)) return;
    await context.queryClient.ensureQueryData(generationIndexQuery(params.lang));
  },
  component: GenerationListPage,
  head: ({ params }) => ({ meta: [{ title: `Generations · ${params.lang}` }] }),
});

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function GenerationListPage() {
  const { lang } = Route.useParams();
  if (!isLocale(lang)) return null;
  const { data } = useSuspenseQuery(generationIndexQuery(lang));

  const [name, setName] = useState("");

  const filtered = useMemo(() => {
    const q = name.trim();
    const needle = q ? normalize(q) : "";
    return data.entries.filter((e) => {
      if (needle && !normalize(e.display_name).includes(needle) && !normalize(e.name).includes(needle)) {
        return false;
      }
      return true;
    });
  }, [data.entries, name]);

  const anyActive = !!name;
  const clearAll = () => {
    setName("");
  };

  return (
    <CatalogShell title="Generations" lede="The Pokémon games, by era." count={data.total}>
      <FilterBar>
        <NameFilter
          value={name}
          onChange={setName}
          placeholder={lang === "es" ? "Filtrar por nombre…" : "Filter by name…"}
        />
        {anyActive ? (
          <button type="button" className="pill-button" onClick={clearAll}>
            {lang === "es" ? "Limpiar" : "Clear"}
          </button>
        ) : null}
      </FilterBar>

      <div className="filter-summary">
        <span>
          {filtered.length} / {data.total}
        </span>
      </div>

      {filtered.length > 0 ? (
        <ul className="grid-cards" aria-label="Generations">
          {filtered.map((entry) => (
            <li key={entry.name}>
              <Link
                to="/$lang/generation/$name"
                params={{ lang, name: entry.slug }}
                className="pokemon-card"
              >
                <div className="pokemon-card__name">{entry.display_name}</div>
                <div className="pokemon-card__id">{entry.main_region.toUpperCase()}</div>
                <div className="pokemon-card__id">{entry.species_count} species</div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="filter-empty">
          {lang === "es" ? "Sin resultados. Ajusta los filtros." : "No results. Adjust filters."}
        </div>
      )}
    </CatalogShell>
  );
}
