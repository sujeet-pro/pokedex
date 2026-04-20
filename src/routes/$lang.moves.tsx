import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { moveIndexQuery } from "~/lib/queries";
import { CatalogShell } from "~/components/CatalogShell";
import { TypeCartridge } from "~/components/TypeCartridge";
import { FilterBar, MultiFilter, NameFilter, SingleFilter } from "~/components/FilterBar";
import { titleCase } from "~/lib/formatters";

export const Route = createFileRoute("/$lang/moves")({
  loader: async ({ context, params }) => {
    if (!isLocale(params.lang)) return;
    await context.queryClient.ensureQueryData(moveIndexQuery(params.lang));
  },
  component: MoveListPage,
  head: ({ params }) => ({ meta: [{ title: `Moves · ${params.lang}` }] }),
});

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function MoveListPage() {
  const { lang } = Route.useParams();
  if (!isLocale(lang)) return null;
  const { data } = useSuspenseQuery(moveIndexQuery(lang));

  const [name, setName] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [damageClass, setDamageClass] = useState<string | null>(null);

  const typeOptions = useMemo(
    () =>
      Array.from(new Set(data.entries.map((e) => e.type)))
        .filter(Boolean)
        .sort()
        .map((value) => ({ value, label: titleCase(value) })),
    [data.entries],
  );

  const damageClassOptions = useMemo(
    () =>
      Array.from(new Set(data.entries.map((e) => e.damage_class)))
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
      if (types.length > 0 && !types.includes(e.type)) return false;
      if (damageClass && e.damage_class !== damageClass) return false;
      return true;
    });
  }, [data.entries, name, types, damageClass]);

  const anyActive = name || types.length > 0 || damageClass;
  const clearAll = () => {
    setName("");
    setTypes([]);
    setDamageClass(null);
  };

  return (
    <CatalogShell title="Moves" lede="Attacks and status techniques." count={data.total}>
      <FilterBar>
        <NameFilter
          value={name}
          onChange={setName}
          placeholder={lang === "fr" ? "Filtrer par nom…" : "Filter by name…"}
        />
        <MultiFilter
          label={lang === "fr" ? "Type" : "Type"}
          options={typeOptions}
          selected={types}
          onChange={setTypes}
        />
        <SingleFilter
          label={lang === "fr" ? "Catégorie" : "Damage class"}
          options={damageClassOptions}
          value={damageClass}
          onChange={setDamageClass}
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

      {filtered.length > 0 ? (
        <ul className="grid-cards" aria-label="Moves">
          {filtered.map((entry) => (
            <li key={entry.name}>
              <Link
                to="/$lang/move/$name"
                params={{ lang, name: entry.slug }}
                className="pokemon-card"
              >
                <div className="pokemon-card__name">{entry.display_name}</div>
                <ul className="pokemon-card__types pill-list" aria-label="Type">
                  <li><TypeCartridge name={entry.type} size="sm" /></li>
                </ul>
                <div className="pokemon-card__id">
                  {titleCase(entry.damage_class)} · PWR {entry.power ?? "—"} · ACC {entry.accuracy ?? "—"} · PP {entry.pp ?? "—"}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="filter-empty">
          {lang === "fr" ? "Aucun résultat. Ajustez les filtres." : "No results. Adjust filters."}
        </div>
      )}
    </CatalogShell>
  );
}
