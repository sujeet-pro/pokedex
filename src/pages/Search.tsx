import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { listPokemonQuery } from "~/api/queries";
import { searchRoute } from "~/router";
import { titleCase } from "~/utils/formatters";

const MAX_RESULTS = 100;

function idFromUrl(url: string): number {
  const m = url.match(/\/(\d+)\/?$/);
  return m ? Number(m[1]) : 0;
}

function Results({ query }: { query: string }) {
  const { data } = useSuspenseQuery(listPokemonQuery());

  const matches = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return [];
    if (q === "all") return data.results.slice(0, MAX_RESULTS);
    return data.results.filter((r) => r.name.includes(q)).slice(0, MAX_RESULTS);
  }, [data.results, query]);

  if (!query) {
    return (
      <div className="error-state">
        <h2>Type something to search</h2>
        <p>Try a name like “ven”, “char”, “pika”, or just “all”.</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="error-state" role="status" aria-live="polite">
        <h2>No Pokémon matched “{query}”</h2>
        <p>Try a different search term.</p>
      </div>
    );
  }

  return (
    <>
      <p style={{ color: "var(--text-muted)" }} aria-live="polite">
        {matches.length} {matches.length === 1 ? "result" : "results"}
      </p>
      <ul className="grid-cards" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {matches.map((r) => {
          const id = idFromUrl(r.url);
          return (
            <li key={r.name}>
              <Link
                to="/pokemon/$name"
                params={{ name: r.name }}
                className="pokemon-card"
                aria-label={`${titleCase(r.name)}, #${String(id).padStart(4, "0")}`}
              >
                <div className="pokemon-card__sprite">
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`}
                    alt=""
                    width={192}
                    height={192}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
                    }}
                  />
                </div>
                <div>
                  <div className="pokemon-card__id">#{String(id).padStart(4, "0")}</div>
                  <div className="pokemon-card__name">{titleCase(r.name)}</div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function SearchPage() {
  const { q } = searchRoute.useSearch();
  const query = (q ?? "").trim();

  return (
    <>
      <h1 className="page-title">Search</h1>
      <p className="page-lede">
        {query ? (
          <>
            Results for <strong>“{query}”</strong>
          </>
        ) : (
          "Find Pokémon by name — partial matches are supported."
        )}
      </p>
      <Results query={query} />
    </>
  );
}
