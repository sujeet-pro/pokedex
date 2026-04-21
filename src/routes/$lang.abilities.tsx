import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { abilityIndexQuery } from "~/lib/queries";
import { CatalogShell } from "~/components/CatalogShell";
import { FilterBar, NameFilter, SingleFilter } from "~/components/FilterBar";
import { titleCase } from "~/lib/formatters";

export const Route = createFileRoute("/$lang/abilities")({
  loader: async ({ context, params }) => {
    if (!isLocale(params.lang)) return;
    await context.queryClient.ensureQueryData(abilityIndexQuery(params.lang));
  },
  component: AbilityListPage,
  head: ({ params }) => ({ meta: [{ title: `Abilities · ${params.lang}` }] }),
});

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function AbilityListPage() {
  const { lang } = Route.useParams();
  if (!isLocale(lang)) return null;
  const { data } = useSuspenseQuery(abilityIndexQuery(lang));

  const [name, setName] = useState("");
  const [generation, setGeneration] = useState<string | null>(null);

  const generationOptions = useMemo(
    () =>
      Array.from(new Set(data.entries.map((e) => e.generation)))
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
      if (generation && e.generation !== generation) return false;
      return true;
    });
  }, [data.entries, name, generation]);

  const anyActive = name || generation;
  const clearAll = () => {
    setName("");
    setGeneration(null);
  };

  return (
    <CatalogShell title="Abilities" lede="Passive and triggered effects." count={data.total}>
      <FilterBar>
        <NameFilter
          value={name}
          onChange={setName}
          placeholder={lang === "es" ? "Filtrar por nombre…" : "Filter by name…"}
        />
        <SingleFilter
          label={lang === "es" ? "Generación" : "Generation"}
          options={generationOptions}
          value={generation}
          onChange={setGeneration}
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
        <ul className="grid-cards" aria-label="Abilities">
          {filtered.map((entry) => (
            <li key={entry.name}>
              <Link
                to="/$lang/ability/$name"
                params={{ lang, name: entry.slug }}
                className="pokemon-card"
              >
                <div className="pokemon-card__name">{entry.display_name}</div>
                <div className="pokemon-card__id">{titleCase(entry.generation)}</div>
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
