import { Suspense, useDeferredValue, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { listPokemonQuery, pokemonQuery, speciesQuery } from "~/api/queries";
import { Sprite } from "~/components/Sprite";
import { TypeBadge } from "~/components/TypeBadge";
import { PokemonCardSkeleton } from "~/components/PokemonCard";
import { cleanFlavor, englishEntry, padId, titleCase } from "~/utils/formatters";
import { pokemonOfTheDayId } from "~/utils/pokemonOfTheDay";

function FeaturedPokemon() {
  const id = useMemo(() => pokemonOfTheDayId(), []);
  const { data: pokemon } = useSuspenseQuery(pokemonQuery(id));
  const { data: species } = useQuery(speciesQuery(id));

  const art =
    pokemon.sprites.other?.["official-artwork"]?.front_default ||
    pokemon.sprites.front_default;
  const flavor = species ? englishEntry(species.flavor_text_entries) : undefined;

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div>
        <span className="hero__label">Pokémon of the day</span>
        <h1 id="hero-title" className="hero__title">
          {titleCase(pokemon.name)}{" "}
          <small style={{ color: "var(--text-muted)" }}>{padId(pokemon.id)}</small>
        </h1>
        <div
          style={{ display: "flex", gap: "0.4rem", marginBlock: "0.5rem 0.75rem" }}
          aria-label="Types"
        >
          {pokemon.types.map((t) => (
            <TypeBadge key={t.type.name} name={t.type.name} />
          ))}
        </div>
        {flavor && (
          <p style={{ margin: 0, color: "var(--text-muted)" }}>{cleanFlavor(flavor.flavor_text)}</p>
        )}
        <Link
          to="/pokemon/$name"
          params={{ name: pokemon.name }}
          className="hero__cta"
        >
          View details
        </Link>
      </div>
      <div className="hero__sprite">
        <Sprite src={art} alt={`${pokemon.name} official artwork`} size={320} priority />
      </div>
    </section>
  );
}

function FeaturedSkeleton() {
  return (
    <section className="hero" aria-busy="true" aria-label="Loading featured Pokémon">
      <div>
        <div className="skeleton" style={{ width: "10rem", height: "0.8rem", marginBottom: "0.5rem" }} />
        <div className="skeleton" style={{ width: "70%", height: "2rem", marginBottom: "0.5rem" }} />
        <div className="skeleton" style={{ width: "100%", height: "3rem" }} />
      </div>
      <div className="skeleton" style={{ aspectRatio: "1" }} />
    </section>
  );
}

function idFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : 0;
}

function BrowseGrid() {
  const [offset, setOffset] = useState(0);
  const pageSize = 24;
  const { data } = useSuspenseQuery(listPokemonQuery());
  const deferredOffset = useDeferredValue(offset);

  const slice = useMemo(
    () => data.results.slice(deferredOffset, deferredOffset + pageSize),
    [data.results, deferredOffset],
  );

  return (
    <section aria-labelledby="browse-heading">
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: "0.75rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <h2 id="browse-heading" style={{ margin: 0 }}>
          Browse all Pokémon
        </h2>
        <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }} aria-live="polite">
          {deferredOffset + 1}–{Math.min(deferredOffset + pageSize, data.results.length)} of{" "}
          {data.results.length}
        </span>
      </div>
      <ul className="grid-cards" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {slice.map((r) => {
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
      <nav
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "0.75rem",
          marginTop: "1.5rem",
        }}
        aria-label="Pagination"
      >
        <button
          type="button"
          className="pill-button"
          onClick={() => setOffset((o) => Math.max(0, o - pageSize))}
          disabled={deferredOffset === 0}
        >
          ← Previous
        </button>
        <button
          type="button"
          className="pill-button"
          onClick={() =>
            setOffset((o) => Math.min(data.results.length - pageSize, o + pageSize))
          }
          disabled={deferredOffset + pageSize >= data.results.length}
        >
          Next →
        </button>
      </nav>
    </section>
  );
}

function BrowseSkeleton() {
  return (
    <ul
      className="grid-cards"
      style={{ listStyle: "none", padding: 0, margin: 0 }}
      aria-busy="true"
      aria-label="Loading Pokémon"
    >
      {Array.from({ length: 12 }, (_, i) => `skeleton-${i}`).map((key) => (
        <li key={key}>
          <PokemonCardSkeleton />
        </li>
      ))}
    </ul>
  );
}

export function HomePage() {
  return (
    <>
      <Suspense fallback={<FeaturedSkeleton />}>
        <FeaturedPokemon />
      </Suspense>
      <Suspense fallback={<BrowseSkeleton />}>
        <BrowseGrid />
      </Suspense>
    </>
  );
}
