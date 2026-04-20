import { Suspense, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";
import { locationBundleQuery, searchIndexQuery } from "~/api/queries";
import { searchRoute } from "~/router";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { SpeakButton } from "~/components/SpeakButton";
import { TypeCartridge } from "~/components/TypeCartridge";
import type { LocationBundle, SearchEntry, SearchKind } from "~/types/bundles";
import { padId, titleCase } from "~/utils/formatters";
import "~/styles/components/LocationCard.css";

const MAX_RESULTS = 200;

const KIND_LABELS: Record<SearchKind, string> = {
  pokemon: "Pokémon",
  type: "Type",
  ability: "Ability",
  species: "Species",
  form: "Form",
  berry: "Berry",
  item: "Item",
  location: "Location",
  move: "Move",
  generation: "Generation",
};

const ALL_KINDS: SearchKind[] = [
  "pokemon",
  "move",
  "ability",
  "item",
  "berry",
  "type",
  "location",
  "generation",
  "species",
  "form",
];

function pokemonSpriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}
function berrySpriteUrl(name: string): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${name}-berry.png`;
}
function itemSpriteUrl(name: string): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${name}.png`;
}

function TextLink({ entry, children, ...rest }: {
  entry: SearchEntry;
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  const common = { children, ...rest };
  switch (entry.kind) {
    case "type":
      return <Link to="/type/$name" params={{ name: entry.name }} {...common} />;
    case "ability":
      return <Link to="/ability/$name" params={{ name: entry.name }} {...common} />;
    case "species":
      return (
        <Link to="/pokemon-species/$name" params={{ name: entry.name }} {...common} />
      );
    case "form":
      return <Link to="/pokemon-form/$name" params={{ name: entry.name }} {...common} />;
    case "move":
      return <Link to="/move/$name" params={{ name: entry.name }} {...common} />;
    case "generation":
      return <Link to="/generations" hash={entry.name} {...common} />;
    case "pokemon":
      return <Link to="/pokemon/$name" params={{ name: entry.name }} {...common} />;
    case "berry":
      return <Link to="/berry/$name" params={{ name: entry.name }} {...common} />;
    case "item":
      return <Link to="/item/$name" params={{ name: entry.name }} {...common} />;
    case "location":
      return <Link to="/locations" hash={entry.name} {...common} />;
  }
}

// ── Result cards ────────────────────────────────────────────────────

function PokemonResult({ entry }: { entry: SearchEntry }) {
  const types = entry.tag ? entry.tag.split(",").filter(Boolean) : [];
  return (
    <Link
      to="/pokemon/$name"
      params={{ name: entry.name }}
      className="catalog-row"
      aria-label={`${titleCase(entry.name)}, ${padId(entry.id)}`}
    >
      <div className="catalog-row__sprite">
        <img
          src={pokemonSpriteUrl(entry.id)}
          alt=""
          loading="lazy"
          decoding="async"
          onError={(ev) => {
            (ev.currentTarget as HTMLImageElement).src =
              `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${entry.id}.png`;
          }}
        />
      </div>
      <div className="catalog-row__body">
        <div className="catalog-row__id">{padId(entry.id)}</div>
        <p className="catalog-row__name">{entry.display_name}</p>
        <div className="catalog-row__meta">
          {types.map((t) => (
            <TypeCartridge key={t} name={t} size="sm" asLink={false} />
          ))}
        </div>
      </div>
    </Link>
  );
}

function BerryResult({ entry }: { entry: SearchEntry }) {
  return (
    <Link
      to="/berry/$name"
      params={{ name: entry.name }}
      className="catalog-row"
      aria-label={entry.display_name}
    >
      <div className="catalog-row__sprite catalog-row__sprite--pixelated">
        <img src={berrySpriteUrl(entry.name)} alt="" loading="lazy" decoding="async" />
      </div>
      <div className="catalog-row__body">
        <div className="catalog-row__id">#{String(entry.id).padStart(3, "0")}</div>
        <p className="catalog-row__name">{entry.display_name}</p>
        <div className="catalog-row__meta">
          {entry.tag && <TypeCartridge name={entry.tag} size="sm" asLink={false} />}
        </div>
      </div>
    </Link>
  );
}

function ItemResult({ entry }: { entry: SearchEntry }) {
  return (
    <Link
      to="/item/$name"
      params={{ name: entry.name }}
      className="catalog-row"
      aria-label={entry.display_name}
    >
      <div className="catalog-row__sprite catalog-row__sprite--pixelated">
        <img
          src={itemSpriteUrl(entry.name)}
          alt=""
          loading="lazy"
          decoding="async"
          onError={(ev) => {
            (ev.currentTarget as HTMLImageElement).style.visibility = "hidden";
          }}
        />
      </div>
      <div className="catalog-row__body">
        <div className="catalog-row__id">#{String(entry.id).padStart(4, "0")}</div>
        <p className="catalog-row__name">{entry.display_name}</p>
        <div className="catalog-row__meta">
          {entry.tag && <span className="catalog-row__tag">{titleCase(entry.tag)}</span>}
        </div>
      </div>
    </Link>
  );
}

function TextResult({ entry }: { entry: SearchEntry }) {
  return (
    <TextLink entry={entry} className="location-card" aria-label={entry.display_name}>
      <div className="location-card__head">
        <div>
          <p className="location-card__name">{entry.display_name}</p>
          <div className="location-card__meta">
            <span className="catalog-row__tag">{KIND_LABELS[entry.kind]}</span>
            {entry.tag && <span className="catalog-row__tag">{titleCase(entry.tag)}</span>}
          </div>
        </div>
      </div>
    </TextLink>
  );
}

function LocationResult({ entry }: { entry: SearchEntry }) {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((v) => !v);
  return (
    <div
      id={`search-location-${entry.name}`}
      className="location-card"
      role="button"
      tabIndex={0}
      aria-expanded={open}
      aria-controls={`search-loc-${entry.name}-body`}
      aria-label={`${entry.display_name} — ${open ? "hide details" : "show details"}`}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      }}
    >
      <div className="location-card__head">
        <div>
          <p className="location-card__name">{entry.display_name}</p>
          <div className="location-card__meta">
            <span className="catalog-row__tag">Location</span>
            {entry.tag && <span className="catalog-row__tag">{titleCase(entry.tag)}</span>}
          </div>
        </div>
        <span aria-hidden="true" className="location-card__chevron">
          ▾
        </span>
      </div>
      {open && (
        <div
          id={`search-loc-${entry.name}-body`}
          className="location-card__body"
          onClick={(e) => e.stopPropagation()}
        >
          <Suspense fallback={<div className="skeleton" style={{ height: "4rem" }} />}>
            <LocationBody name={entry.name} />
          </Suspense>
        </div>
      )}
    </div>
  );
}

function LocationBody({ name }: { name: string }) {
  const [{ data }] = useSuspenseQueries({
    queries: [locationBundleQuery(name)],
  });
  return <LocationBodyRender bundle={data} />;
}

function LocationBodyRender({ bundle }: { bundle: LocationBundle }) {
  return (
    <>
      <ul className="location-card__stats">
        {bundle.region && (
          <li>
            <span className="location-card__label">Region</span>
            <span>{titleCase(bundle.region)}</span>
          </li>
        )}
        {bundle.generation && (
          <li>
            <span className="location-card__label">Generation</span>
            <span>{titleCase(bundle.generation.replace("generation-", ""))}</span>
          </li>
        )}
        <li>
          <span className="location-card__label">Areas</span>
          <span>{bundle.areas.length}</span>
        </li>
      </ul>
      {bundle.areas.length > 0 && (
        <ul className="pill-list" style={{ marginTop: "0.5rem" }}>
          {bundle.areas.map((a) => (
            <li key={a.name}>
              <span className="pill">{titleCase(a.name)}</span>
            </li>
          ))}
        </ul>
      )}
      <div style={{ marginTop: "0.6rem" }}>
        <SpeakButton kind="location" name={bundle.name} displayName={bundle.display_name} />
      </div>
    </>
  );
}

function ResultCard({ entry }: { entry: SearchEntry }) {
  switch (entry.kind) {
    case "pokemon":
      return <PokemonResult entry={entry} />;
    case "berry":
      return <BerryResult entry={entry} />;
    case "item":
      return <ItemResult entry={entry} />;
    case "location":
      return <LocationResult entry={entry} />;
    default:
      return <TextResult entry={entry} />;
  }
}

// ── Page ────────────────────────────────────────────────────────────

function Results({ query, kind }: { query: string; kind?: SearchKind }) {
  const { data } = useSuspenseQuery(searchIndexQuery());

  const matches = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    const universe = kind ? data.entries.filter((e) => e.kind === kind) : data.entries;
    if (q === "all") return universe.slice(0, MAX_RESULTS);
    return universe
      .filter(
        (r) => r.name.includes(q) || r.display_name.toLowerCase().includes(q) || r.tag === q,
      )
      .slice(0, MAX_RESULTS);
  }, [data.entries, query, kind]);

  if (!query) {
    return (
      <div className="error-state">
        <h2>&gt; Awaiting input</h2>
        <p>Search Pokémon, moves, items, berries, abilities, locations, types — everything.</p>
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

  // Group matches by kind so the results page stays legible when a query is
  // ambiguous across resource types.
  const groups = new Map<SearchKind, SearchEntry[]>();
  for (const m of matches) {
    const bucket = groups.get(m.kind) ?? [];
    bucket.push(m);
    groups.set(m.kind, bucket);
  }

  const kindOrder = ALL_KINDS.filter((k) => groups.has(k));

  return (
    <>
      <p className="catalog-head__count" aria-live="polite" style={{ margin: "0 0 0.75rem" }}>
        {matches.length} {matches.length === 1 ? "result" : "results"}
        {kind && ` in ${KIND_LABELS[kind]}`}
      </p>
      {kindOrder.map((k) => {
        const items = groups.get(k)!;
        return (
          <section key={k} style={{ marginBottom: "1.5rem" }}>
            <div className="hud-card__title" style={{ marginBottom: "0.5rem" }}>
              <span>{KIND_LABELS[k]}</span>
              <span>{items.length}</span>
            </div>
            <ul className="catalog-grid--rows">
              {items.map((m) => (
                <li key={`${m.kind}:${m.name}`}>
                  <ResultCard entry={m} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}

export function SearchPage() {
  const { q, kind } = searchRoute.useSearch();
  const query = (q ?? "").trim();
  const kindFilter = (kind as SearchKind | undefined) ?? undefined;

  return (
    <ConsoleDevice
      title="POKÉ DEX · SEARCH"
      subtitle={query ? `filter · "${query}"` : "enter a query"}
      ariaLabel="Search everything"
    >
      <div>
        <p className="hud-row">
          <b>MODE</b> · CROSS-RESOURCE · MAX {MAX_RESULTS}
        </p>
        <h1 className="hud-name">Search</h1>
        <p className="hud-flavor">
          {query
            ? `Matches for "${query}"${kindFilter ? ` in ${KIND_LABELS[kindFilter]}` : ""}.`
            : "Find anything — Pokémon, moves, items, abilities, berries, locations, types. Partial matches supported."}
        </p>

        <div style={{ marginTop: "1rem" }}>
          <Suspense
            fallback={
              <div
                className="skeleton"
                style={{ height: "18rem" }}
                aria-busy="true"
                aria-label="Loading search index"
              />
            }
          >
            <Results query={query} kind={kindFilter} />
          </Suspense>
        </div>
      </div>
    </ConsoleDevice>
  );
}
