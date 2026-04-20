import { Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";
import { evolutionChainByUrlQuery, pokemonQuery, speciesQuery, typeQuery } from "~/api/queries";
import { pokemonRoute } from "~/router";
import { AbilityButton } from "~/components/AbilityButton";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { DossierField } from "~/components/DossierField";
import { SpeakButton } from "~/components/SpeakButton";
import { Sprite } from "~/components/Sprite";
import { StatRadar } from "~/components/StatRadar";
import { TypeCartridge } from "~/components/TypeCartridge";
import { WeaknessGrid } from "~/components/WeaknessGrid";
import type { EvolutionChainLink, Pokemon, PokemonSpecies } from "~/types/pokeapi";
import {
  cleanFlavor,
  decimetersToMeters,
  englishEntry,
  hectogramsToKg,
  padId,
  titleCase,
} from "~/utils/formatters";

function evoTrigger(details: EvolutionChainLink["evolution_details"][number] | undefined): string {
  if (!details) return "";
  if (details.min_level != null) return `LVL ${details.min_level}`;
  if (details.item) return titleCase(details.item.name);
  if (details.trigger?.name) return details.trigger.name.replace(/-/g, " ");
  return "";
}

function EvolutionChain({
  chainUrl,
  currentName,
}: {
  chainUrl: string | null | undefined;
  currentName: string;
}) {
  const { data } = useQuery(evolutionChainByUrlQuery(chainUrl));
  if (!data) return null;

  const nodes: { name: string; id: number; trigger: string }[] = [];

  function walk(node: EvolutionChainLink, incomingTrigger: string) {
    const id = Number(node.species.url.match(/\/(\d+)\/?$/)?.[1] ?? 0);
    nodes.push({ name: node.species.name, id, trigger: incomingTrigger });
    for (const child of node.evolves_to) {
      walk(child, evoTrigger(child.evolution_details[0]));
    }
  }
  walk(data.chain, "");

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

// ── Pager (bezel footer) — self-fetches so we can show a stable pre-data shell.

function DetailPager({ urlName }: { urlName: string }) {
  const { data } = useQuery(pokemonQuery(urlName));
  const id = data?.id ?? null;
  const display = data ? `${padId(data.id)} · ${titleCase(data.name)}` : "—";
  const prevId = id ? Math.max(1, id - 1) : null;
  const nextId = id ? Math.min(1025, id + 1) : null;

  return (
    <>
      <div className="device__dpad" aria-hidden="true" />
      <nav aria-label="Adjacent entries" className="pager">
        <span className="pager__label mono">{display}</span>
        {prevId != null ? (
          <Link
            className="pill-button pager__prev"
            to="/pokemon/$name"
            params={{ name: String(prevId) }}
            aria-label={`Previous entry, ${padId(prevId)}`}
          >
            ◀ Prev {padId(prevId)}
          </Link>
        ) : (
          <button
            type="button"
            className="pill-button pager__prev"
            disabled
            aria-label="Previous entry — loading"
          >
            ◀ Prev ————
          </button>
        )}
        {nextId != null ? (
          <Link
            className="pill-button pager__next"
            to="/pokemon/$name"
            params={{ name: String(nextId) }}
            aria-label={`Next entry, ${padId(nextId)}`}
          >
            Next {padId(nextId)} ▶
          </Link>
        ) : (
          <button
            type="button"
            className="pill-button pager__next"
            disabled
            aria-label="Next entry — loading"
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

// ── The two HUD halves — left (identity) and right (infographics) ──────

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

// ── Real content (mounted inside Suspense) ────────────────────────────

function PokemonDetailContent({ name }: { name: string }) {
  const { data: pokemon } = useSuspenseQuery(pokemonQuery(name));
  const typeResults = useSuspenseQueries({
    queries: pokemon.types.map((t) => typeQuery(t.type.name)),
  });
  const defenders = typeResults.map((r) => r.data);
  const { data: species } = useQuery(speciesQuery(pokemon.species.name));

  const art =
    pokemon.sprites.other?.["official-artwork"]?.front_default || pokemon.sprites.front_default;
  const flavor = species ? englishEntry(species.flavor_text_entries) : undefined;
  const genus = species ? englishEntry(species.genera) : undefined;

  const statsForRadar = pokemon.stats.map((s) => ({ name: s.stat.name, value: s.base_stat }));
  const total = statsForRadar.reduce((a, s) => a + s.value, 0);

  return (
    <>
      <div className="screen__hud">
        <div>
          <p className="hud-row">
            <b>DEX</b> {padId(pokemon.id).slice(1)} &nbsp;·&nbsp; <b>GEN</b>{" "}
            {species?.generation.name.replace("generation-", "").toUpperCase() ?? "—"} &nbsp;·&nbsp;{" "}
            <b>ORD</b> {pokemon.order}
          </p>
          <h1 className="hud-name">{titleCase(pokemon.name)}</h1>
          {genus && <div className="hud-genus">{genus.genus}</div>}

          <div className="hud-sprite">
            <Sprite src={art} alt={`${pokemon.name} artwork`} priority />
            <span className="hud-sprite__corners" aria-hidden="true">
              <span /> <span /> <span /> <span />
            </span>
          </div>

          <div className="cart-row" aria-label="Types">
            {pokemon.types.map((t) => (
              <TypeCartridge key={t.type.name} name={t.type.name} />
            ))}
          </div>

          {flavor && <p className="hud-flavor">{cleanFlavor(flavor.flavor_text)}</p>}
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
              <dd>{decimetersToMeters(pokemon.height)}</dd>
            </div>
            <div>
              <dt>Weight</dt>
              <dd>{hectogramsToKg(pokemon.weight)}</dd>
            </div>
            <div>
              <dt>Base XP</dt>
              <dd className="mono">{pokemon.base_experience}</dd>
            </div>
            {species && (
              <>
                <div>
                  <dt>Catch</dt>
                  <dd className="mono">
                    {species.capture_rate}
                    <small> /255</small>
                  </dd>
                </div>
                <div>
                  <dt>Happy</dt>
                  <dd className="mono">{species.base_happiness}</dd>
                </div>
                <div>
                  <dt>Hatch</dt>
                  <dd className="mono">
                    {species.hatch_counter ?? 0}
                    <small> steps</small>
                  </dd>
                </div>
              </>
            )}
          </dl>

          <div className="hud-card">
            <WeaknessGrid defenders={defenders} />
          </div>
        </div>
      </div>

      {species?.evolution_chain?.url && (
        <Suspense
          fallback={
            <div
              className="skeleton"
              style={{ height: "6rem", marginTop: "1rem" }}
              aria-busy="true"
              aria-label="Loading evolution chain"
            />
          }
        >
          <EvolutionChain chainUrl={species.evolution_chain.url} currentName={pokemon.name} />
        </Suspense>
      )}

      <div className="screen__hud" style={{ marginTop: "1.25rem", gridTemplateColumns: "1fr 1fr" }}>
        <div className="hud-card">
          <div className="hud-card__title">
            <span>Abilities</span>
            <span>{pokemon.abilities.length}</span>
          </div>
          <ul className="ability-list">
            {pokemon.abilities.map((a) => (
              <li key={a.ability.name}>
                <AbilityButton name={a.ability.name} isHidden={a.is_hidden} />
              </li>
            ))}
          </ul>
        </div>

        {species && <DossierCard pokemon={pokemon} species={species} />}
      </div>
    </>
  );
}

function DossierCard({ pokemon, species }: { pokemon: Pokemon; species: PokemonSpecies }) {
  const eggGroups = species.egg_groups.map((e) => titleCase(e.name)).join(" · ") || "—";
  const rarity = species.is_legendary
    ? "Legendary"
    : species.is_mythical
      ? "Mythical"
      : species.is_baby
        ? "Baby"
        : "Standard";
  const habitat = species.habitat ? titleCase(species.habitat.name) : "Unknown";
  const shape = species.shape ? titleCase(species.shape.name) : "Unknown";

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
          <DossierField termKey="color" value={titleCase(species.color.name)} />
        </li>
        <li>
          <DossierField termKey="growth" value={titleCase(species.growth_rate.name)} />
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
            <Link to="/pokemon-species/$id" params={{ id: pokemon.species.name }} className="pill">
              Species · {titleCase(pokemon.species.name)}
            </Link>
          </li>
          {pokemon.forms.map((f) => (
            <li key={f.name}>
              <Link to="/pokemon-form/$id" params={{ id: f.name }} className="pill">
                Form · {titleCase(f.name)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
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
      headerAction={<SpeakButton pokemonName={lowerName} displayName={displayName} />}
      footer={<DetailPager urlName={lowerName} />}
    >
      <Suspense
        fallback={
          <>
            <div className="screen__hud">
              <LeftHudSkeleton urlName={name} />
              <RightHudSkeleton />
            </div>
          </>
        }
      >
        <PokemonDetailContent name={lowerName} />
      </Suspense>
    </ConsoleDevice>
  );
}
