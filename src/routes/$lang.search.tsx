import { useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { searchIndexQuery } from "~/lib/queries";
import { CatalogShell } from "~/components/CatalogShell";
import { PillFilter } from "~/components/PillFilter";
import type { ResourceKind, SearchIndexEntry } from "~/types/bundles";

type SearchParams = {
  q?: string;
  kind?: string;
};

const KIND_OPTIONS: { value: ResourceKind; label: string }[] = [
  { value: "pokemon", label: "Pokémon" },
  { value: "pokemon-species", label: "Species" },
  { value: "pokemon-form", label: "Forms" },
  { value: "type", label: "Types" },
  { value: "ability", label: "Abilities" },
  { value: "berry", label: "Berries" },
  { value: "item", label: "Items" },
  { value: "move", label: "Moves" },
  { value: "location", label: "Locations" },
  { value: "generation", label: "Generations" },
];

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

function kindDetailLink(kind: ResourceKind): "/$lang/pokemon/$name" |
  "/$lang/pokemon-species/$name" |
  "/$lang/pokemon-form/$name" |
  "/$lang/type/$name" |
  "/$lang/ability/$name" |
  "/$lang/berry/$name" |
  "/$lang/item/$name" |
  "/$lang/move/$name" |
  "/$lang/generation/$name" |
  null {
  switch (kind) {
    case "pokemon": return "/$lang/pokemon/$name";
    case "pokemon-species": return "/$lang/pokemon-species/$name";
    case "pokemon-form": return "/$lang/pokemon-form/$name";
    case "type": return "/$lang/type/$name";
    case "ability": return "/$lang/ability/$name";
    case "berry": return "/$lang/berry/$name";
    case "item": return "/$lang/item/$name";
    case "move": return "/$lang/move/$name";
    case "generation": return "/$lang/generation/$name";
    case "location":
      // Locations don't have a detail route; link to the index.
      return null;
    default:
      return null;
  }
}

function SearchPage() {
  const { lang } = Route.useParams();
  const { q = "", kind = "" } = Route.useSearch();
  const navigate = useNavigate();
  if (!isLocale(lang)) return null;

  const { data } = useSuspenseQuery(searchIndexQuery(lang));

  const kinds = useMemo(
    () => (kind ? kind.split(",").filter(Boolean) : []),
    [kind],
  );

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const kindSet = new Set(kinds);
    return data.entries.filter((e) => {
      if (kindSet.size > 0 && !kindSet.has(e.kind)) return false;
      if (!needle) return true;
      return (
        e.name.toLowerCase().includes(needle) ||
        e.display_name.toLowerCase().includes(needle)
      );
    });
  }, [data.entries, q, kinds]);

  // Group by kind for display.
  const grouped = useMemo(() => {
    const g = new Map<ResourceKind, SearchIndexEntry[]>();
    for (const entry of results) {
      const bucket = g.get(entry.kind) ?? [];
      bucket.push(entry);
      g.set(entry.kind, bucket);
    }
    return g;
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

  return (
    <CatalogShell
      title="Search"
      lede={`Search across ${data.total} entries.`}
      count={results.length}
    >
      <div className="panel">
        <div className="panel__title">Query</div>
        <div className="search">
          <input
            autoFocus
            type="search"
            className="search__input"
            placeholder="Type to filter…"
            value={q}
            onChange={(e) => setQ(e.currentTarget.value)}
            aria-label="Search query"
          />
        </div>
        <div style={{ marginTop: ".75rem" }}>
          <PillFilter
            options={KIND_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            selected={kinds}
            onChange={setKinds}
            ariaLabel="Filter by kind"
          />
        </div>
      </div>

      {Array.from(grouped.entries()).map(([k, entries]) => (
        <div key={k} className="panel">
          <div className="panel__title">
            {KIND_OPTIONS.find((o) => o.value === k)?.label ?? k} · {entries.length}
          </div>
          <ul className="grid-cards" aria-label={`${k} results`}>
            {entries.slice(0, 120).map((entry) => {
              const to = kindDetailLink(entry.kind);
              const body = (
                <>
                  <div className="pokemon-card__name">{entry.display_name}</div>
                  <div className="pokemon-card__id">{entry.kind}</div>
                  {entry.tag ? <div className="pokemon-card__id">{entry.tag}</div> : null}
                </>
              );
              return (
                <li key={`${entry.kind}:${entry.name}`}>
                  {to ? (
                    <Link
                      to={to}
                      params={{ lang, name: entry.slug }}
                      className="pokemon-card"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="pokemon-card">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </CatalogShell>
  );
}
