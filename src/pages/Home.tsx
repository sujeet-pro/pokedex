import { Suspense, useDeferredValue, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { listPokemonQuery, pokemonQuery, speciesQuery } from "~/api/queries";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { PokemonCardSkeleton } from "~/components/PokemonCard";
import { SpeakButton } from "~/components/SpeakButton";
import { Sprite } from "~/components/Sprite";
import { TypeCartridge } from "~/components/TypeCartridge";
import { cleanFlavor, englishEntry, padId, titleCase } from "~/utils/formatters";
import { randomPokemonId } from "~/utils/randomPokemon";

// ── featured (random) Pokémon ──────────────────────────────────────────

function FeaturedShell() {
  // Roll once per mount. Reload = new pick; client-side nav = same pick.
  const id = useMemo(() => randomPokemonId(), []);
  const idStr = String(id);

  return (
    <ConsoleDevice
      title="POKÉ DEX · FEATURED"
      subtitle={`random pick · ${padId(id)}`}
      ariaLabel="Random featured Pokémon"
      headerAction={<SpeakButton pokemonName={idStr} />}
      footer={
        <>
          <div className="device__dpad" aria-hidden="true" />
          <div style={{ textAlign: "center" }}>
            <Link
              to="/pokemon/$name"
              params={{ name: idStr }}
              className="hero-cta"
              style={{ marginTop: 0 }}
            >
              Open full scan →
            </Link>
          </div>
          <div className="device__ab" aria-hidden="true">
            <span className="device__btn">A</span>
            <span className="device__btn device__btn--b">B</span>
          </div>
        </>
      }
    >
      <Suspense fallback={<FeaturedInnerSkeleton />}>
        <FeaturedInner id={id} />
      </Suspense>
    </ConsoleDevice>
  );
}

function FeaturedInner({ id }: { id: number }) {
  const { data: pokemon } = useSuspenseQuery(pokemonQuery(id));
  const { data: species } = useQuery(speciesQuery(id));

  const art =
    pokemon.sprites.other?.["official-artwork"]?.front_default || pokemon.sprites.front_default;
  const flavor = species ? englishEntry(species.flavor_text_entries) : undefined;

  return (
    <div className="screen__hud">
      <div>
        <p className="hud-row">
          <b>RANDOM</b> · {padId(pokemon.id)}
        </p>
        <h1 className="hud-name">{titleCase(pokemon.name)}</h1>
        <div className="hud-genus">{englishEntry(species?.genera ?? [])?.genus ?? "Pokémon"}</div>
        <div className="cart-row" aria-label="Types">
          {pokemon.types.map((t) => (
            <TypeCartridge key={t.type.name} name={t.type.name} />
          ))}
        </div>
        {flavor && <p className="hud-flavor">{cleanFlavor(flavor.flavor_text)}</p>}
      </div>
      <div className="hud-sprite">
        <Sprite src={art} alt={`${pokemon.name} official artwork`} priority />
        <span className="hud-sprite__corners" aria-hidden="true">
          <span /> <span /> <span /> <span />
        </span>
      </div>
    </div>
  );
}

function FeaturedInnerSkeleton() {
  return (
    <div className="screen__hud" aria-busy="true" aria-label="Loading featured Pokémon">
      <div>
        <p className="hud-row">
          <b>RANDOM</b> · ————
        </p>
        <h1 className="hud-name" style={{ opacity: 0.45 }}>
          Loading…
        </h1>
        <div className="hud-genus" style={{ opacity: 0 }}>
          placeholder
        </div>
        <div className="cart-row" aria-hidden="true">
          <span className="skeleton" style={{ width: "64px", height: "28px" }} />
          <span className="skeleton" style={{ width: "64px", height: "28px" }} />
        </div>
        <div className="skeleton" style={{ height: "4.5rem", marginTop: "1rem", width: "100%" }} />
      </div>
      <div className="hud-sprite">
        <div
          className="skeleton"
          style={{ width: "82%", aspectRatio: "1", border: 0, background: "transparent" }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

// ── browse-all catalog ─────────────────────────────────────────────────

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
      <div className="catalog-head">
        <h2 id="browse-heading">Catalog · all entries</h2>
        <span className="catalog-head__count" aria-live="polite">
          {deferredOffset + 1}–{Math.min(deferredOffset + pageSize, data.results.length)} /{" "}
          {data.results.length}
        </span>
      </div>
      <ul className="grid-cards">
        {slice.map((r) => {
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
      <nav className="nav-buttons" aria-label="Pagination">
        <button
          type="button"
          className="pill-button"
          onClick={() => setOffset((o) => Math.max(0, o - pageSize))}
          disabled={deferredOffset === 0}
        >
          ◀ Previous
        </button>
        <button
          type="button"
          className="pill-button"
          onClick={() => setOffset((o) => Math.min(data.results.length - pageSize, o + pageSize))}
          disabled={deferredOffset + pageSize >= data.results.length}
        >
          Next ▶
        </button>
      </nav>
    </section>
  );
}

function BrowseSkeleton() {
  return (
    <ul className="grid-cards" aria-busy="true" aria-label="Loading Pokémon">
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
      <FeaturedShell />
      <Suspense fallback={<BrowseSkeleton />}>
        <BrowseGrid />
      </Suspense>
    </>
  );
}
