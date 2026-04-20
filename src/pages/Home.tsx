import { Suspense, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  berryBundleQuery,
  berryIndexQuery,
  itemBundleQuery,
  itemIndexQuery,
  locationBundleQuery,
  locationIndexQuery,
  moveBundleQuery,
  moveIndexQuery,
  pokemonBundleQuery,
  pokemonIndexQuery,
} from "~/api/queries";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { SpeakButton } from "~/components/SpeakButton";
import { Sprite } from "~/components/Sprite";
import { TypeCartridge } from "~/components/TypeCartridge";
import { padId, titleCase } from "~/utils/formatters";
import "~/styles/components/HomeFeatured.css";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

// Featured Pokémon ─────────────────────────────────────────────────

function FeaturedPokemon() {
  const { data: index } = useSuspenseQuery(pokemonIndexQuery());
  const entry = useMemo(() => pickRandom(index.entries), [index.entries]);

  return (
    <ConsoleDevice
      title="POKÉ DEX · FEATURED"
      subtitle={`random pick · ${padId(entry.id)}`}
      ariaLabel="Random featured Pokémon"
      headerAction={
        <SpeakButton kind="pokemon" name={entry.name} displayName={titleCase(entry.name)} />
      }
      footer={
        <>
          <div className="device__dpad" aria-hidden="true" />
          <div style={{ textAlign: "center" }}>
            <Link
              to="/pokemon/$name"
              params={{ name: entry.name }}
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
      <Suspense fallback={<FeaturedPokemonSkeleton />}>
        <FeaturedPokemonBody name={entry.name} />
      </Suspense>
    </ConsoleDevice>
  );
}

function FeaturedPokemonBody({ name }: { name: string }) {
  const { data } = useSuspenseQuery(pokemonBundleQuery(name));
  const art = data.sprites.official_artwork || data.sprites.front_default;
  return (
    <div className="screen__hud">
      <div>
        <p className="hud-row">
          <b>RANDOM</b> · {padId(data.id)}
        </p>
        <h1 className="hud-name">{titleCase(data.name)}</h1>
        <div className="hud-genus">{data.species.genus ?? "Pokémon"}</div>
        <div className="cart-row" aria-label="Types">
          {data.types.map((t) => (
            <TypeCartridge key={t.name} name={t.name} />
          ))}
        </div>
        {data.species.flavor && <p className="hud-flavor">{data.species.flavor}</p>}
      </div>
      <div className="hud-sprite">
        <Sprite src={art} alt={`${data.name} official artwork`} priority />
        <span className="hud-sprite__corners" aria-hidden="true">
          <span /> <span /> <span /> <span />
        </span>
      </div>
    </div>
  );
}

function FeaturedPokemonSkeleton() {
  return (
    <div className="screen__hud" aria-busy="true" aria-label="Loading featured Pokémon">
      <div>
        <p className="hud-row">
          <b>RANDOM</b> · ————
        </p>
        <h1 className="hud-name" style={{ opacity: 0.45 }}>
          Loading…
        </h1>
        <div className="cart-row" aria-hidden="true">
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

// Shared featured card shell ───────────────────────────────────────

function FeaturedCard({
  title,
  browseTo,
  browseLabel,
  children,
}: {
  title: string;
  browseTo: string;
  browseLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="featured-card">
      <header className="featured-card__head">
        <h2 className="featured-card__title">{title}</h2>
        <Link to={browseTo} className="featured-card__browse">
          {browseLabel} →
        </Link>
      </header>
      <Suspense
        fallback={<div className="skeleton" style={{ height: "8rem", marginTop: "0.5rem" }} />}
      >
        {children}
      </Suspense>
    </section>
  );
}

// Featured Berry ───────────────────────────────────────────────────

function FeaturedBerryBody() {
  const { data: index } = useSuspenseQuery(berryIndexQuery());
  const entry = useMemo(() => pickRandom(index.entries), [index.entries]);
  const { data } = useSuspenseQuery(berryBundleQuery(entry.name));
  return (
    <Link to="/berry/$name" params={{ name: data.name }} className="featured-card__link">
      <div className="featured-card__media featured-card__media--berry">
        <img
          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${data.name}-berry.png`}
          alt=""
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="featured-card__body">
        <div className="featured-card__name">{data.display_name}</div>
        <div className="featured-card__meta">
          <TypeCartridge name={data.natural_gift_type} size="sm" asLink={false} />
          <span className="featured-card__tag">{titleCase(data.firmness)}</span>
        </div>
      </div>
    </Link>
  );
}

// Featured Item ────────────────────────────────────────────────────

function FeaturedItemBody() {
  const { data: index } = useSuspenseQuery(itemIndexQuery());
  // Bias toward items with sprites so the card has a visual.
  const withSprite = useMemo(() => index.entries.filter((e) => e.sprite), [index.entries]);
  const entry = useMemo(() => pickRandom(withSprite.length ? withSprite : index.entries), [index.entries, withSprite]);
  const { data } = useSuspenseQuery(itemBundleQuery(entry.name));
  return (
    <Link to="/item/$name" params={{ name: data.name }} className="featured-card__link">
      <div className="featured-card__media featured-card__media--item">
        {data.sprite && (
          <img
            src={data.sprite}
            alt=""
            loading="lazy"
            decoding="async"
            style={{ imageRendering: "pixelated" }}
          />
        )}
      </div>
      <div className="featured-card__body">
        <div className="featured-card__name">{data.display_name}</div>
        <div className="featured-card__meta">
          <span className="featured-card__tag">{titleCase(data.category)}</span>
          {data.cost > 0 && <span className="featured-card__tag">₽{data.cost}</span>}
        </div>
        {data.short_effect && (
          <p className="featured-card__flavor">{data.short_effect}</p>
        )}
      </div>
    </Link>
  );
}

// Featured Location ────────────────────────────────────────────────

function FeaturedLocationBody() {
  const { data: index } = useSuspenseQuery(locationIndexQuery());
  const entry = useMemo(() => pickRandom(index.entries), [index.entries]);
  const { data } = useSuspenseQuery(locationBundleQuery(entry.name));
  return (
    <Link to="/locations" hash={data.name} className="featured-card__link">
      <div className="featured-card__body featured-card__body--text-only">
        <div className="featured-card__name">{data.display_name}</div>
        <div className="featured-card__meta">
          {data.region && <span className="featured-card__tag">{titleCase(data.region)}</span>}
          {data.generation && (
            <span className="featured-card__tag">
              {titleCase(data.generation.replace("generation-", ""))}
            </span>
          )}
          <span className="featured-card__tag">
            {data.areas.length} area{data.areas.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </Link>
  );
}

// Featured Move ────────────────────────────────────────────────────

function FeaturedMoveBody() {
  const { data: index } = useSuspenseQuery(moveIndexQuery());
  const entry = useMemo(() => pickRandom(index.entries), [index.entries]);
  const { data } = useSuspenseQuery(moveBundleQuery(entry.name));
  return (
    <Link to="/move/$name" params={{ name: data.name }} className="featured-card__link">
      <div className="featured-card__body featured-card__body--text-only">
        <div className="featured-card__name">{data.display_name}</div>
        <div className="featured-card__meta">
          <TypeCartridge name={data.type} size="sm" asLink={false} />
          <span className="featured-card__tag">{titleCase(data.damage_class)}</span>
          <span className="featured-card__tag mono">PWR {data.power ?? "—"}</span>
          <span className="featured-card__tag mono">ACC {data.accuracy ?? "—"}</span>
        </div>
        {data.short_effect && <p className="featured-card__flavor">{data.short_effect}</p>}
      </div>
    </Link>
  );
}

// Page ─────────────────────────────────────────────────────────────

export function HomePage() {
  return (
    <>
      <Suspense
        fallback={
          <ConsoleDevice
            title="POKÉ DEX · FEATURED"
            subtitle="loading"
            ariaLabel="Loading featured"
          >
            <FeaturedPokemonSkeleton />
          </ConsoleDevice>
        }
      >
        <FeaturedPokemon />
      </Suspense>

      <div className="featured-grid">
        <FeaturedCard title="Featured Berry" browseTo="/berries" browseLabel="All berries">
          <FeaturedBerryBody />
        </FeaturedCard>
        <FeaturedCard title="Featured Item" browseTo="/items" browseLabel="All items">
          <FeaturedItemBody />
        </FeaturedCard>
        <FeaturedCard title="Featured Location" browseTo="/locations" browseLabel="All locations">
          <FeaturedLocationBody />
        </FeaturedCard>
        <FeaturedCard title="Featured Move" browseTo="/moves" browseLabel="All moves">
          <FeaturedMoveBody />
        </FeaturedCard>
      </div>
    </>
  );
}
