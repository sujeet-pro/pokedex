import { useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale, type Locale } from "~/types/locales";
import { searchIndexQuery } from "~/lib/queries";
import { CatalogShell } from "~/components/CatalogShell";
import {
  ActiveFilters,
  FilterBar,
  MultiFilter,
  NameFilter,
  type ActiveFilterTag,
} from "~/components/FilterBar";
import { berryArtwork, itemArtwork, pokemonArtwork } from "~/lib/sprites";
import { padDex, titleCase } from "~/lib/formatters";
import { typeInfo } from "~/lib/typeInfo";
import { makeT } from "~/i18n";
import type { ResourceKind, SearchIndexEntry } from "~/types/bundles";

type SearchParams = {
  q?: string;
  kind?: string;
};

/**
 * Display order for search result groups. Image-rich kinds come first
 * (pokemon, species, forms, berries, items) so the page opens with visual
 * cards; text-only kinds (types, abilities, moves, locations, generations)
 * follow.
 */
const KIND_OPTIONS: { value: ResourceKind; label: string }[] = [
  { value: "pokemon", label: "Pokémon" },
  { value: "pokemon-species", label: "Species" },
  { value: "pokemon-form", label: "Forms" },
  { value: "berry", label: "Berries" },
  { value: "item", label: "Items" },
  { value: "type", label: "Types" },
  { value: "ability", label: "Abilities" },
  { value: "move", label: "Moves" },
  { value: "location", label: "Locations" },
  { value: "generation", label: "Generations" },
];

const KIND_ORDER: ResourceKind[] = KIND_OPTIONS.map((o) => o.value);

export const Route = createFileRoute("/$lang/search")({
  validateSearch: (search): SearchParams => ({
    q: typeof search.q === "string" ? search.q : undefined,
    kind: typeof search.kind === "string" ? search.kind : undefined,
  }),
  loader: async ({ context, params }) => {
    if (!isLocale(params.lang)) return;
    await context.queryClient.ensureQueryData(searchIndexQuery(params.lang));
  },
  component: SearchPage,
  head: ({ params }) => ({ meta: [{ title: `Search · ${params.lang}` }] }),
});

type DetailKindLink =
  | "/$lang/pokemon/$name"
  | "/$lang/pokemon-species/$name"
  | "/$lang/pokemon-form/$name"
  | "/$lang/type/$name"
  | "/$lang/ability/$name"
  | "/$lang/berry/$name"
  | "/$lang/item/$name"
  | "/$lang/move/$name"
  | "/$lang/generation/$name";

function kindDetailLink(kind: ResourceKind): DetailKindLink | null {
  switch (kind) {
    case "pokemon":
      return "/$lang/pokemon/$name";
    case "pokemon-species":
      return "/$lang/pokemon-species/$name";
    case "pokemon-form":
      return "/$lang/pokemon-form/$name";
    case "type":
      return "/$lang/type/$name";
    case "ability":
      return "/$lang/ability/$name";
    case "berry":
      return "/$lang/berry/$name";
    case "item":
      return "/$lang/item/$name";
    case "move":
      return "/$lang/move/$name";
    case "generation":
      return "/$lang/generation/$name";
    case "location":
      return null;
    default:
      return null;
  }
}

function romanize(num: number): string {
  const map: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let out = "";
  let n = num;
  for (const [v, s] of map) {
    while (n >= v) {
      out += s;
      n -= v;
    }
  }
  return out || "I";
}

type CardVisual =
  | { kind: "art"; src: string; pixel?: boolean }
  | { kind: "type"; type: string }
  | { kind: "letters"; text: string; accent?: string };

function cardVisual(entry: SearchIndexEntry): CardVisual {
  switch (entry.kind) {
    case "pokemon":
    case "pokemon-species":
    case "pokemon-form":
      return { kind: "art", src: pokemonArtwork(entry.id) };
    case "berry":
      return { kind: "art", src: berryArtwork(entry.name), pixel: true };
    case "item":
      return { kind: "art", src: itemArtwork(entry.name), pixel: true };
    case "type":
      return { kind: "type", type: entry.name };
    case "move":
      return { kind: "letters", text: "MV", accent: entry.tag };
    case "ability":
      return { kind: "letters", text: "AB" };
    case "location":
      return { kind: "letters", text: "LOC" };
    case "generation":
      return { kind: "letters", text: romanize(entry.id) };
    default:
      return { kind: "letters", text: "?" };
  }
}

function cardMeta(entry: SearchIndexEntry): string | null {
  switch (entry.kind) {
    case "pokemon":
    case "pokemon-species":
    case "pokemon-form":
      return padDex(entry.id);
    case "berry":
      return entry.tag ? `${titleCase(entry.tag)} firmness` : null;
    case "item":
      return entry.tag ? titleCase(entry.tag) : null;
    case "type":
      return entry.tag ? titleCase(entry.tag) : "Type";
    case "move":
      return entry.tag ? `${titleCase(entry.tag)} move` : "Move";
    case "ability":
      return "Ability";
    case "location":
      return entry.tag ? `${titleCase(entry.tag)} region` : "Location";
    case "generation":
      return entry.tag ? titleCase(entry.tag) : "Generation";
    default:
      return null;
  }
}

function cardTag(entry: SearchIndexEntry): string | null {
  if (
    entry.kind === "pokemon" ||
    entry.kind === "pokemon-species" ||
    entry.kind === "pokemon-form"
  ) {
    return entry.tag ? titleCase(entry.tag) : null;
  }
  return null;
}

function CardVisualSlot({ visual, alt }: { visual: CardVisual; alt: string }) {
  if (visual.kind === "art") {
    return (
      <div
        className={`search-card__sprite${visual.pixel ? " search-card__sprite--pixel" : ""}`}
        aria-hidden
      >
        <img src={visual.src} alt="" loading="lazy" width={96} height={96} />
        <span className="visually-hidden">{alt}</span>
      </div>
    );
  }
  if (visual.kind === "type") {
    const info = typeInfo(visual.type);
    return (
      <div
        className="search-card__badge search-card__badge--type"
        style={{ background: info.color, color: info.textColor }}
        aria-hidden
      >
        {info.short}
      </div>
    );
  }
  const accent = visual.accent ? typeInfo(visual.accent) : null;
  return (
    <div
      className="search-card__badge"
      style={
        accent
          ? { background: accent.color, color: accent.textColor, borderColor: accent.color }
          : undefined
      }
      aria-hidden
    >
      {visual.text}
    </div>
  );
}

function SearchCardItem({ entry, lang }: { entry: SearchIndexEntry; lang: Locale }) {
  const to = kindDetailLink(entry.kind);
  const visual = cardVisual(entry);
  const meta = cardMeta(entry);
  const tag = cardTag(entry);

  const body = (
    <>
      <CardVisualSlot visual={visual} alt={entry.display_name} />
      <div className="search-card__body">
        {meta ? <div className="search-card__meta">{meta}</div> : null}
        <div className="search-card__name">{entry.display_name}</div>
        <div className="search-card__tag">{tag ?? "\u00a0"}</div>
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} params={{ lang, name: entry.slug }} className="search-card">
        {body}
      </Link>
    );
  }
  return <div className="search-card search-card--static">{body}</div>;
}

function SearchPage() {
  const { lang } = Route.useParams();
  const { q = "", kind = "" } = Route.useSearch();
  const navigate = useNavigate();
  if (!isLocale(lang)) return null;

  const t = makeT(lang);
  const { data } = useSuspenseQuery(searchIndexQuery(lang));

  const kinds = useMemo(() => (kind ? kind.split(",").filter(Boolean) : []), [kind]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const kindSet = new Set(kinds);
    return data.entries.filter((e) => {
      if (kindSet.size > 0 && !kindSet.has(e.kind)) return false;
      if (!needle) return true;
      return e.name.toLowerCase().includes(needle) || e.display_name.toLowerCase().includes(needle);
    });
  }, [data.entries, q, kinds]);

  const groupedOrdered = useMemo(() => {
    const g = new Map<ResourceKind, SearchIndexEntry[]>();
    for (const entry of results) {
      const bucket = g.get(entry.kind) ?? [];
      bucket.push(entry);
      g.set(entry.kind, bucket);
    }
    return KIND_ORDER.map((k) => [k, g.get(k) ?? []] as const).filter(
      ([, entries]) => entries.length > 0,
    );
  }, [results]);

  function setKinds(next: string[]) {
    navigate({
      to: "/$lang/search",
      params: { lang },
      search: { q: q || undefined, kind: next.length > 0 ? next.join(",") : undefined },
    });
  }

  function setQ(value: string) {
    navigate({
      to: "/$lang/search",
      params: { lang },
      search: { q: value || undefined, kind: kind || undefined },
    });
  }

  function clearAll() {
    navigate({ to: "/$lang/search", params: { lang }, search: {} });
  }

  const activeTags: ActiveFilterTag[] = [];
  if (q.trim()) {
    activeTags.push({
      id: "name",
      label: t("filter_name"),
      value: q.trim(),
      onRemove: () => setQ(""),
    });
  }
  for (const k of kinds) {
    const opt = KIND_OPTIONS.find((o) => o.value === k);
    activeTags.push({
      id: `kind:${k}`,
      label: lang === "es" ? "Tipo" : "Kind",
      value: opt?.label ?? k,
      onRemove: () => setKinds(kinds.filter((v) => v !== k)),
    });
  }

  const anyActive = activeTags.length > 0;

  return (
    <CatalogShell
      title={t("nav_search")}
      lede={
        lang === "es"
          ? `Busca entre ${data.total} entradas.`
          : `Search across ${data.total} entries.`
      }
      count={results.length}
    >
      <FilterBar>
        <NameFilter
          value={q}
          onChange={setQ}
          placeholder={lang === "es" ? "Filtrar por nombre…" : "Filter by name…"}
        />
        <MultiFilter
          label={lang === "es" ? "Tipo" : "Kind"}
          options={KIND_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          selected={kinds}
          onChange={setKinds}
        />
        {anyActive ? (
          <button type="button" className="pill-button" onClick={clearAll}>
            {t("filter_clear_all")}
          </button>
        ) : null}
      </FilterBar>

      <ActiveFilters
        tags={activeTags}
        count={`${results.length} / ${data.total}`}
        removeLabel={t("filter_remove")}
      />

      {groupedOrdered.length > 0 ? (
        groupedOrdered.map(([k, entries]) => {
          const kindLabel = KIND_OPTIONS.find((o) => o.value === k)?.label ?? k;
          const headingId = `search-group-${k}`;
          return (
            <section key={k} className="search-group" aria-labelledby={headingId}>
              <h2 id={headingId} className="search-group__heading">
                <span>{kindLabel}</span>
                <span className="search-group__count">{entries.length}</span>
              </h2>
              <ul className="search-grid" aria-label={`${kindLabel} results`}>
                {entries.slice(0, 120).map((entry) => (
                  <li key={`${entry.kind}:${entry.name}`}>
                    <SearchCardItem entry={entry} lang={lang} />
                  </li>
                ))}
                {entries.length > 120 ? (
                  <li className="search-grid__more">
                    {lang === "es"
                      ? `y ${entries.length - 120} más…`
                      : `and ${entries.length - 120} more…`}
                  </li>
                ) : null}
              </ul>
            </section>
          );
        })
      ) : (
        <div className="filter-empty">
          {lang === "es" ? "Sin resultados. Ajusta los filtros." : "No results. Adjust filters."}
        </div>
      )}
    </CatalogShell>
  );
}
