import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { itemIndexQuery } from "~/lib/queries";
import { CatalogShell } from "~/components/CatalogShell";
import { FilterBar, NameFilter, SingleFilter } from "~/components/FilterBar";
import { titleCase } from "~/lib/formatters";

export const Route = createFileRoute("/$lang/items")({
  loader: async ({ context, params }) => {
    if (!isLocale(params.lang)) return;
    await context.queryClient.ensureQueryData(itemIndexQuery(params.lang));
  },
  component: ItemListPage,
  head: ({ params }) => ({ meta: [{ title: `Items · ${params.lang}` }] }),
});

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const MAX_CATEGORY_OPTIONS = 30;

function ItemListPage() {
  const { lang } = Route.useParams();
  if (!isLocale(lang)) return null;
  const { data } = useSuspenseQuery(itemIndexQuery(lang));

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  // Category options capped at top-30 by frequency. Categories can exceed 50.
  const categoryOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of data.entries) {
      if (!e.category) continue;
      counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
    }
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, MAX_CATEGORY_OPTIONS);
    return top
      .map(([value, count]) => ({ value, label: titleCase(value), tag: String(count) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [data.entries]);

  const filtered = useMemo(() => {
    const q = name.trim();
    const needle = q ? normalize(q) : "";
    return data.entries.filter((e) => {
      if (needle && !normalize(e.display_name).includes(needle) && !normalize(e.name).includes(needle)) {
        return false;
      }
      if (category && e.category !== category) return false;
      return true;
    });
  }, [data.entries, name, category]);

  const anyActive = name || category;
  const clearAll = () => {
    setName("");
    setCategory(null);
  };

  return (
    <CatalogShell title="Items" lede="All catalog items." count={data.total}>
      <FilterBar>
        <NameFilter
          value={name}
          onChange={setName}
          placeholder={lang === "fr" ? "Filtrer par nom…" : "Filter by name…"}
        />
        <SingleFilter
          label={lang === "fr" ? "Catégorie" : "Category"}
          options={categoryOptions}
          value={category}
          onChange={setCategory}
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
        <ul className="grid-cards" aria-label="Items">
          {filtered.map((entry) => (
            <li key={entry.name}>
              <Link
                to="/$lang/item/$name"
                params={{ lang, name: entry.slug }}
                className="pokemon-card"
              >
                <div className="pokemon-card__name">{entry.display_name}</div>
                <div className="pokemon-card__id">{titleCase(entry.category)}</div>
                <div className="pokemon-card__id">¥{entry.cost}</div>
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
