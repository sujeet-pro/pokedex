import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { berryIndexQuery } from "~/lib/queries";
import { CatalogShell } from "~/components/CatalogShell";
import { TypeCartridge } from "~/components/TypeCartridge";
import {
  ActiveFilters,
  FilterBar,
  MultiFilter,
  NameFilter,
  SingleFilter,
  type ActiveFilterTag,
} from "~/components/FilterBar";
import { berryArtwork } from "~/lib/sprites";
import { titleCase } from "~/lib/formatters";
import { makeT } from "~/i18n";

export const Route = createFileRoute("/$lang/berries")({
  loader: async ({ context, params }) => {
    if (!isLocale(params.lang)) return;
    await context.queryClient.ensureQueryData(berryIndexQuery(params.lang));
  },
  component: BerryListPage,
  head: ({ params }) => ({ meta: [{ title: `Berries · ${params.lang}` }] }),
});

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function BerryListPage() {
  const { lang } = Route.useParams();
  if (!isLocale(lang)) return null;
  const t = makeT(lang);
  const { data } = useSuspenseQuery(berryIndexQuery(lang));

  const [name, setName] = useState("");
  const [firmness, setFirmness] = useState<string | null>(null);
  const [giftTypes, setGiftTypes] = useState<string[]>([]);

  const firmnessOptions = useMemo(
    () =>
      Array.from(new Set(data.entries.map((e) => e.firmness)))
        .filter(Boolean)
        .sort()
        .map((value) => ({ value, label: titleCase(value) })),
    [data.entries],
  );

  const giftTypeOptions = useMemo(
    () =>
      Array.from(new Set(data.entries.map((e) => e.natural_gift_type)))
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
      if (firmness && e.firmness !== firmness) return false;
      if (giftTypes.length > 0 && !giftTypes.includes(e.natural_gift_type)) return false;
      return true;
    });
  }, [data.entries, name, firmness, giftTypes]);

  const anyActive = name || firmness || giftTypes.length > 0;
  const clearAll = () => {
    setName("");
    setFirmness(null);
    setGiftTypes([]);
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
  if (firmness) {
    const opt = firmnessOptions.find((o) => o.value === firmness);
    activeTags.push({
      id: `firmness:${firmness}`,
      label: t("filter_firmness"),
      value: opt?.label ?? firmness,
      onRemove: () => setFirmness(null),
    });
  }
  for (const value of giftTypes) {
    const opt = giftTypeOptions.find((o) => o.value === value);
    activeTags.push({
      id: `gift:${value}`,
      label: t("filter_natural_gift"),
      value: opt?.label ?? value,
      onRemove: () => setGiftTypes(giftTypes.filter((v) => v !== value)),
    });
  }

  return (
    <CatalogShell
      title={t("list_berries_heading")}
      lede={t("list_berries_subtitle")}
      count={data.total}
    >
      <FilterBar>
        <NameFilter
          value={name}
          onChange={setName}
          placeholder={lang === "es" ? "Filtrar por nombre…" : "Filter by name…"}
        />
        <SingleFilter
          label={t("filter_firmness")}
          options={firmnessOptions}
          value={firmness}
          onChange={setFirmness}
        />
        <MultiFilter
          label={t("filter_natural_gift")}
          options={giftTypeOptions}
          selected={giftTypes}
          onChange={setGiftTypes}
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
        <ul className="grid-cards" aria-label="Berries">
          {filtered.map((entry) => (
            <li key={entry.name}>
              <Link
                to="/$lang/berry/$name"
                params={{ lang, name: entry.slug }}
                className="pokemon-card"
              >
                <div className="pokemon-card__sprite pokemon-card__sprite--pixel">
                  <img src={berryArtwork(entry.name)} alt="" loading="lazy" width={96} height={96} />
                </div>
                <div className="pokemon-card__id">{titleCase(entry.firmness)}</div>
                <div className="pokemon-card__name">{entry.display_name}</div>
                <ul className="pokemon-card__types pill-list" aria-label="Natural gift">
                  <li>
                    <TypeCartridge name={entry.natural_gift_type} size="sm" />
                  </li>
                </ul>
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
