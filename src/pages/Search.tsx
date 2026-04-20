import { Suspense, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { listPokemonQuery } from "~/api/queries";
import { searchRoute } from "~/router";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { padId, titleCase } from "~/utils/formatters";

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
        <h2>&gt; Awaiting input</h2>
        <p>
          Try a name like &ldquo;ven&rdquo;, &ldquo;char&rdquo;, &ldquo;pika&rdquo;, or
          &ldquo;all&rdquo;.
        </p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="error-state" role="status" aria-live="polite">
        <h2>&gt; No match for &ldquo;{query}&rdquo;</h2>
        <p>Try a different query.</p>
      </div>
    );
  }

  return (
    <>
      <p className="catalog-head__count" aria-live="polite" style={{ margin: "0 0 0.75rem" }}>
        {matches.length} {matches.length === 1 ? "result" : "results"}
      </p>
      <ul className="grid-cards">
        {matches.map((r) => {
          const id = idFromUrl(r.url);
          return (
            <li key={r.name}>
              <Link
                to="/pokemon/$name"
                params={{ name: r.name }}
                className="pokemon-card"
                aria-label={`${titleCase(r.name)}, ${padId(id)}`}
              >
                <div className="pokemon-card__sprite">
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`}
                    alt=""
                    width={450}
                    height={450}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
                    }}
                  />
                </div>
                <div className="pokemon-card__id">{padId(id)}</div>
                <div className="pokemon-card__name">{titleCase(r.name)}</div>
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
    <ConsoleDevice
      title="POKÉ DEX · SEARCH"
      subtitle={query ? `filter · "${query}"` : "enter a query"}
      ariaLabel="Search Pokémon"
    >
      <div>
        <p className="hud-row">
          <b>MODE</b> · TEXT MATCH · MAX {MAX_RESULTS}
        </p>
        <h1 className="hud-name">Search</h1>
        <p className="hud-flavor">
          {query
            ? `Showing matches for "${query}".`
            : "Find Pokémon by name — partial matches are supported. Focus the navbar field with /."}
        </p>

        <div style={{ marginTop: "1rem" }}>
          <Suspense
            fallback={
              <div
                className="skeleton"
                style={{ height: "18rem" }}
                aria-busy="true"
                aria-label="Loading Pokémon list"
              />
            }
          >
            <Results query={query} />
          </Suspense>
        </div>
      </div>
    </ConsoleDevice>
  );
}
