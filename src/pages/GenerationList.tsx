import { Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { generationBundleQuery, generationIndexQuery } from "~/api/queries";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { SpeakButton } from "~/components/SpeakButton";
import { TypeCartridge } from "~/components/TypeCartridge";
import type { GenerationBundle } from "~/types/bundles";
import { titleCase } from "~/utils/formatters";

function GenerationSection({ name }: { name: string }) {
  const { data } = useSuspenseQuery(generationBundleQuery(name));
  return <GenerationSectionBody bundle={data} />;
}

function GenerationSectionBody({ bundle: data }: { bundle: GenerationBundle }) {
  return (
    <section id={data.name} className="hud-card" style={{ marginTop: "1.25rem" }}>
      <div className="hud-card__title">
        <span>
          <b>{data.display_name}</b>
          <span
            style={{
              marginLeft: "0.6rem",
              color: "var(--phosphor-dim)",
              fontWeight: "normal",
              letterSpacing: "0.08em",
            }}
          >
            · {titleCase(data.main_region)} region
          </span>
        </span>
        <SpeakButton kind="generation" name={data.name} displayName={data.display_name} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "0.5rem",
          margin: "0.75rem 0",
        }}
      >
        <Stat label="Species" value={data.pokemon_species_count} />
        <Stat label="Moves" value={data.moves_count} />
        <Stat label="Abilities" value={data.abilities.length} />
        <Stat label="New types" value={data.types.length} />
        <Stat label="Versions" value={data.version_groups.length} />
      </div>

      {data.types.length > 0 && (
        <div style={{ marginTop: "0.5rem" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--phosphor-dim)",
              marginBottom: "0.35rem",
            }}
          >
            Introduced types
          </div>
          <div className="cart-row" style={{ marginTop: 0 }}>
            {data.types.map((t) => (
              <TypeCartridge key={t.name} name={t.name} size="sm" />
            ))}
          </div>
        </div>
      )}

      {data.version_groups.length > 0 && (
        <div style={{ marginTop: "0.5rem" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--phosphor-dim)",
              marginBottom: "0.35rem",
            }}
          >
            Version groups
          </div>
          <ul className="pill-list">
            {data.version_groups.map((v) => (
              <li key={v.name}>
                <span className="pill">{titleCase(v.name)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.abilities.length > 0 && (
        <details style={{ marginTop: "0.5rem" }}>
          <summary
            style={{
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--phosphor-dim)",
            }}
          >
            {data.abilities.length} new abilities
          </summary>
          <ul className="pill-list" style={{ marginTop: "0.35rem" }}>
            {data.abilities.map((a) => (
              <li key={a.name}>
                <Link to="/ability/$name" params={{ name: a.name }} className="pill">
                  {titleCase(a.name)}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        padding: "0.4rem 0.6rem",
        borderRadius: "6px",
        background: "color-mix(in srgb, var(--phosphor) 6%, transparent)",
        border: "1px solid color-mix(in srgb, var(--phosphor) 20%, transparent)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.65rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--phosphor-dim)",
        }}
      >
        {label}
      </div>
      <div className="mono" style={{ fontSize: "1.25rem" }}>
        {value}
      </div>
    </div>
  );
}

function GenerationsBody() {
  const { data } = useSuspenseQuery(generationIndexQuery());
  return (
    <>
      <div>
        <p className="hud-row">
          <b>CATALOG</b> · {data.total} GENERATIONS
        </p>
        <h1 className="hud-name">Generations</h1>
        <p className="hud-flavor">
          A compact overview of every main-series generation: the region it&rsquo;s set in,
          the species, moves and abilities it added, and the games that ship each one.
        </p>
        <nav
          aria-label="Jump to generation"
          style={{
            display: "flex",
            gap: "0.35rem",
            flexWrap: "wrap",
            marginTop: "0.75rem",
          }}
        >
          {data.entries.map((g) => (
            <a key={g.name} href={`#${g.name}`} className="pill" style={{ textDecoration: "none" }}>
              {g.display_name}
            </a>
          ))}
        </nav>
      </div>

      {data.entries.map((g) => (
        <Suspense
          key={g.name}
          fallback={<div className="skeleton" style={{ height: "10rem", marginTop: "1rem" }} />}
        >
          <GenerationSection name={g.name} />
        </Suspense>
      ))}
    </>
  );
}

export function GenerationListPage() {
  return (
    <ConsoleDevice
      title="POKÉ DEX · GENERATIONS"
      subtitle="all gens"
      ariaLabel="All Pokémon generations"
    >
      <Suspense
        fallback={
          <div className="skeleton" style={{ height: "20rem" }} aria-busy="true" />
        }
      >
        <GenerationsBody />
      </Suspense>
    </ConsoleDevice>
  );
}
