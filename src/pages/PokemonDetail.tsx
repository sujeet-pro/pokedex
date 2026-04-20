import { Suspense } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useSuspenseQuery } from "@tanstack/react-query";
import { pokemonBundleQuery } from "~/api/queries";
import { pokemonRoute } from "~/router";
import { AbilityButton } from "~/components/AbilityButton";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { DossierField } from "~/components/DossierField";
import { PokemonSummary } from "~/components/PokemonSummary";
import { SpeakButton } from "~/components/SpeakButton";
import { Sprite } from "~/components/Sprite";
import { StatRadar } from "~/components/StatRadar";
import { TypeCartridge } from "~/components/TypeCartridge";
import { WeaknessGrid } from "~/components/WeaknessGrid";
import type { BundleEvoNode, PokemonBundle } from "~/types/bundles";
import { decimetersToMeters, hectogramsToKg, padId, titleCase } from "~/utils/formatters";

function EvolutionChain({
  root,
  currentName,
}: {
  root: BundleEvoNode;
  currentName: string;
}) {
  const nodes: { name: string; id: number; trigger: string }[] = [];

  function walk(node: BundleEvoNode) {
    nodes.push({ name: node.name, id: node.id, trigger: node.trigger });
    for (const child of node.evolves_to) walk(child);
  }
  walk(root);

  if (nodes.length < 2) {
    return (
      <p
        className="hud-row"
        style={{ margin: 0, color: "var(--phosphor-dim)", letterSpacing: "0.1em" }}
      >
        &gt; This Pokémon does not evolve.
      </p>
    );
  }

  return (
    <ol className="evo" aria-label="Evolution chain">
      {nodes.map((n, i) => (
        <li key={n.name} style={{ display: "contents" }}>
          {i > 0 && (
            <div className="evo__arr" aria-hidden="true">
              <div>▶ {nodes[i].trigger || "—"}</div>
              <div>evolves to</div>
            </div>
          )}
          <div className="evo__cell" data-current={n.name === currentName ? "true" : undefined}>
            <Link
              to="/pokemon/$name"
              params={{ name: n.name }}
              className="evo__frame"
              aria-label={`${titleCase(n.name)}, ${padId(n.id)}${
                n.name === currentName ? ", current entry" : ""
              }`}
            >
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${n.id}.png`}
                alt=""
                width={450}
                height={450}
                loading="lazy"
                decoding="async"
              />
            </Link>
            <div className="evo__label">{titleCase(n.name)}</div>
            <div className="evo__sub">{padId(n.id)}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function DetailPager({ bundle }: { bundle: PokemonBundle }) {
  const display = `${padId(bundle.id)} · ${titleCase(bundle.name)}`;
  const { prev, next } = bundle.pager;

  return (
    <>
      <div className="device__dpad" aria-hidden="true" />
      <nav aria-label="Adjacent entries" className="pager">
        <span className="pager__label mono">{display}</span>
        {prev ? (
          <Link
            className="pill-button pager__prev"
            to="/pokemon/$name"
            params={{ name: prev.name }}
            aria-label={`Previous entry, ${padId(prev.id)}`}
          >
            ◀ Prev {padId(prev.id)}
          </Link>
        ) : (
          <button
            type="button"
            className="pill-button pager__prev"
            disabled
            aria-label="No previous entry"
          >
            ◀ Prev ————
          </button>
        )}
        {next ? (
          <Link
            className="pill-button pager__next"
            to="/pokemon/$name"
            params={{ name: next.name }}
            aria-label={`Next entry, ${padId(next.id)}`}
          >
            Next {padId(next.id)} ▶
          </Link>
        ) : (
          <button
            type="button"
            className="pill-button pager__next"
            disabled
            aria-label="No next entry"
          >
            Next ———— ▶
          </button>
        )}
      </nav>
      <div className="device__ab" aria-hidden="true">
        <span className="device__btn">A</span>
        <span className="device__btn device__btn--b">B</span>
      </div>
    </>
  );
}

function LeftHudSkeleton({ urlName }: { urlName: string }) {
  return (
    <div>
      <p className="hud-row">
        <b>DEX</b> ———— &nbsp;·&nbsp; <b>GEN</b> — &nbsp;·&nbsp; <b>ORD</b> —
      </p>
      <h1 className="hud-name" aria-busy="true">
        {titleCase(urlName)}
      </h1>
      <div className="hud-genus" style={{ opacity: 0.5 }}>
        Loading entry…
      </div>
      <div className="hud-sprite" aria-hidden="true">
        <div
          className="skeleton"
          style={{ width: "82%", aspectRatio: "1", border: 0, background: "transparent" }}
        />
        <span className="hud-sprite__corners" aria-hidden="true">
          <span /> <span /> <span /> <span />
        </span>
      </div>
      <div className="cart-row" aria-hidden="true">
        <span className="skeleton" style={{ width: "72px", height: "28px" }} />
      </div>
      <div className="skeleton" style={{ height: "4rem", marginTop: "1rem" }} />
    </div>
  );
}

function RightHudSkeleton() {
  return (
    <div className="hud__column">
      <div className="hud-card">
        <div className="hud-card__title">
          <span>Base stats · hex</span>
          <span className="mono">Σ —</span>
        </div>
        <StatRadar stats={[]} loading />
      </div>

      <dl className="readouts" aria-busy="true">
        {["Height", "Weight", "Base XP", "Catch", "Happy", "Hatch"].map((term) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>—</dd>
          </div>
        ))}
      </dl>

      <div className="hud-card">
        <div className="hud-card__title">
          <span>Damage taken · 18 types</span>
          <span className="mono">—</span>
        </div>
        <div
          className="skeleton"
          aria-hidden="true"
          style={{ height: "180px", borderRadius: "var(--radius-sm)" }}
        />
      </div>
    </div>
  );
}

function PokemonDetailContent({ name }: { name: string }) {
  const { data } = useSuspenseQuery(pokemonBundleQuery(name));
  const navigate = useNavigate();

  const art = data.sprites.official_artwork || data.sprites.front_default;
  const statsForRadar = data.stats.map((s) => ({ name: s.name, value: s.base_stat }));
  const total = statsForRadar.reduce((a, s) => a + s.value, 0);

  useHotkey("[", (e) => {
    if (!data.pager.prev) return;
    e.preventDefault();
    navigate({ to: "/pokemon/$name", params: { name: data.pager.prev.name } });
  });
  useHotkey("]", (e) => {
    if (!data.pager.next) return;
    e.preventDefault();
    navigate({ to: "/pokemon/$name", params: { name: data.pager.next.name } });
  });

  return (
    <>
      <div className="screen__hud">
        <div>
          <p className="hud-row">
            <b>DEX</b> {padId(data.id).slice(1)} &nbsp;·&nbsp; <b>GEN</b>{" "}
            {data.species.generation.replace("generation-", "").toUpperCase()} &nbsp;·&nbsp;{" "}
            <b>ORD</b> {data.order}
          </p>
          <h1 className="hud-name">{titleCase(data.name)}</h1>
          {data.species.genus && <div className="hud-genus">{data.species.genus}</div>}

          <div className="hud-sprite">
            <Sprite src={art} alt={`${data.name} artwork`} priority />
            <span className="hud-sprite__corners" aria-hidden="true">
              <span /> <span /> <span /> <span />
            </span>
          </div>

          <div className="cart-row" aria-label="Types">
            {data.types.map((t) => (
              <TypeCartridge key={t.name} name={t.name} />
            ))}
          </div>

          {data.species.flavor && <p className="hud-flavor">{data.species.flavor}</p>}

          <PokemonSummary id={data.id} available={data.has_summary} />
        </div>

        <div className="hud__column">
          <div className="hud-card">
            <div className="hud-card__title">
              <span>Base stats · hex</span>
              <span className="mono">Σ {total}</span>
            </div>
            <StatRadar stats={statsForRadar} total={total} />
          </div>

          <dl className="readouts">
            <div>
              <dt>Height</dt>
              <dd>{decimetersToMeters(data.height)}</dd>
            </div>
            <div>
              <dt>Weight</dt>
              <dd>{hectogramsToKg(data.weight)}</dd>
            </div>
            <div>
              <dt>Base XP</dt>
              <dd className="mono">{data.base_experience}</dd>
            </div>
            <div>
              <dt>Catch</dt>
              <dd className="mono">
                {data.species.capture_rate}
                <small> /255</small>
              </dd>
            </div>
            <div>
              <dt>Happy</dt>
              <dd className="mono">{data.species.base_happiness}</dd>
            </div>
            <div>
              <dt>Hatch</dt>
              <dd className="mono">
                {data.species.hatch_counter ?? 0}
                <small> steps</small>
              </dd>
            </div>
          </dl>

          <div className="hud-card">
            <WeaknessGrid defenders={data.defenders} />
          </div>
        </div>
      </div>

      {data.evolution_chain && (
        <EvolutionChain root={data.evolution_chain} currentName={data.name} />
      )}

      <div className="screen__hud" style={{ marginTop: "1.25rem", gridTemplateColumns: "1fr 1fr" }}>
        <div className="hud-card">
          <div className="hud-card__title">
            <span>Abilities</span>
            <span>{data.abilities.length}</span>
          </div>
          <ul className="ability-list">
            {data.abilities.map((a) => (
              <li key={a.name}>
                <AbilityButton name={a.name} isHidden={a.is_hidden} />
              </li>
            ))}
          </ul>
        </div>

        <DossierCard bundle={data} />
      </div>
    </>
  );
}

function DossierCard({ bundle }: { bundle: PokemonBundle }) {
  const { species } = bundle;
  const eggGroups = species.egg_groups.map((e) => titleCase(e)).join(" · ") || "—";
  const rarity = species.is_legendary
    ? "Legendary"
    : species.is_mythical
      ? "Mythical"
      : species.is_baby
        ? "Baby"
        : "Standard";
  const habitat = species.habitat ? titleCase(species.habitat) : "Unknown";
  const shape = species.shape ? titleCase(species.shape) : "Unknown";

  return (
    <div className="hud-card">
      <div className="hud-card__title">
        <span>Dossier</span>
        <span>meta</span>
      </div>
      <ul className="dossier-list">
        <li>
          <DossierField termKey="habitat" value={habitat} />
        </li>
        <li>
          <DossierField termKey="shape" value={shape} />
        </li>
        <li>
          <DossierField termKey="color" value={titleCase(species.color)} />
        </li>
        <li>
          <DossierField termKey="growth" value={titleCase(species.growth_rate)} />
        </li>
        <li>
          <DossierField termKey="egg-groups" value={eggGroups} />
        </li>
        <li>
          <DossierField termKey="rarity" value={rarity} />
        </li>
      </ul>
      <div style={{ marginTop: "0.75rem" }}>
        <ul className="pill-list">
          <li>
            <Link
              to="/pokemon-species/$name"
              params={{ name: species.name }}
              className="pill"
            >
              Species · {titleCase(species.name)}
            </Link>
          </li>
          {bundle.forms.map((f) => (
            <li key={f.name}>
              <Link to="/pokemon-form/$name" params={{ name: f.name }} className="pill">
                Form · {titleCase(f.name)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DetailPagerShell({ name }: { name: string }) {
  // Suspense-safe wrapper — the pager needs the bundle to fill prev/next.
  return (
    <Suspense fallback={<DetailPagerPlaceholder name={name} />}>
      <DetailPagerFromBundle name={name} />
    </Suspense>
  );
}

function DetailPagerFromBundle({ name }: { name: string }) {
  const { data } = useSuspenseQuery(pokemonBundleQuery(name));
  return <DetailPager bundle={data} />;
}

function DetailPagerPlaceholder({ name }: { name: string }) {
  return (
    <>
      <div className="device__dpad" aria-hidden="true" />
      <nav aria-label="Adjacent entries" className="pager">
        <span className="pager__label mono">— · {titleCase(name)}</span>
        <button type="button" className="pill-button pager__prev" disabled>
          ◀ Prev ————
        </button>
        <button type="button" className="pill-button pager__next" disabled>
          Next ———— ▶
        </button>
      </nav>
      <div className="device__ab" aria-hidden="true">
        <span className="device__btn">A</span>
        <span className="device__btn device__btn--b">B</span>
      </div>
    </>
  );
}

export function PokemonDetailPage() {
  const { name } = pokemonRoute.useParams();
  const lowerName = name.toLowerCase();
  const displayName = titleCase(name);
  return (
    <ConsoleDevice
      title="POKÉ DEX · SCANNER"
      subtitle={`read · ${displayName}`}
      ariaLabel={`Pokédex entry for ${displayName}`}
      headerAction={<SpeakButton kind="pokemon" name={lowerName} displayName={displayName} />}
      footer={<DetailPagerShell name={lowerName} />}
    >
      <Suspense
        fallback={
          <div className="screen__hud">
            <LeftHudSkeleton urlName={name} />
            <RightHudSkeleton />
          </div>
        }
      >
        <PokemonDetailContent name={lowerName} />
      </Suspense>
    </ConsoleDevice>
  );
}
