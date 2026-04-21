import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { itemIndexQuery } from "~/lib/queries";
import { CatalogShell } from "~/components/CatalogShell";
import {
  ActiveFilters,
  FilterBar,
  NameFilter,
  SingleFilter,
  type ActiveFilterTag,
} from "~/components/FilterBar";
import { itemArtwork } from "~/lib/sprites";
import { titleCase } from "~/lib/formatters";
import { makeT } from "~/i18n";

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
  const t = makeT(lang);
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

  const activeTags: ActiveFilterTag[] = [];
  if (name.trim()) {
    activeTags.push({
      id: "name",
      label: t("filter_name"),
      value: name.trim(),
      onRemove: () => setName(""),
    });
  }
  if (category) {
    const opt = categoryOptions.find((o) => o.value === category);
    activeTags.push({
      id: `category:${category}`,
      label: t("filter_category"),
      value: opt?.label ?? category,
      onRemove: () => setCategory(null),
    });
  }

  return (
    <CatalogShell
      title={t("list_items_heading")}
      lede={t("list_items_subtitle")}
      count={data.total}
    >
      <FilterBar>
        <NameFilter
          value={name}
          onChange={setName}
          placeholder={lang === "es" ? "Filtrar por nombre…" : "Filter by name…"}
        />
        <SingleFilter
          label={t("filter_category")}
          options={categoryOptions}
          value={category}
          onChange={setCategory}
        />
        {anyActive ? (
          <button type="button" className="pill-button" onClick={clearAll}>
            {t("filter_clear_all")}
          </button>
        ) : null}
      </FilterBar>

      <ActiveFilters
        tags={activeTags}
        count={`${filtered.length} / ${data.total}`}
        removeLabel={t("filter_remove")}
      />

      {filtered.length > 0 ? (
        <ul className="grid-cards" aria-label="Items">
          {filtered.map((entry) => (
            <li key={entry.name}>
              <Link
                to="/$lang/item/$name"
                params={{ lang, name: entry.slug }}
                className="pokemon-card"
              >
                <div className="pokemon-card__sprite pokemon-card__sprite--pixel">
                  <img src={itemArtwork(entry.name)} alt="" loading="lazy" width={64} height={64} />
                </div>
                <div className="pokemon-card__id">{titleCase(entry.category)}</div>
                <div className="pokemon-card__name">{entry.display_name}</div>
                <div className="pokemon-card__id">¥{entry.cost}</div>
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
