import { Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { evolutionChainByUrlQuery, pokemonQuery, speciesQuery } from "~/api/queries";
import { pokemonRoute } from "~/router";
import { Sprite } from "~/components/Sprite";
import { StatBar } from "~/components/StatBar";
import { TypeBadge } from "~/components/TypeBadge";
import type { EvolutionChainLink } from "~/types/pokeapi";
import {
  cleanFlavor,
  decimetersToMeters,
  englishEntry,
  hectogramsToKg,
  padId,
  titleCase,
} from "~/utils/formatters";

function EvolutionChain({ chainUrl }: { chainUrl: string | null | undefined }) {
  const { data } = useQuery(evolutionChainByUrlQuery(chainUrl));
  if (!data) return null;

  const links: string[] = [];
  function walk(node: EvolutionChainLink) {
    links.push(node.species.name);
    node.evolves_to.forEach(walk);
  }
  walk(data.chain);

  if (links.length < 2) {
    return <p style={{ color: "var(--text-muted)" }}>This Pokémon does not evolve.</p>;
  }

  return (
    <ol
      className="evo-chain"
      aria-label="Evolution chain"
      style={{ listStyle: "none", padding: 0, margin: 0 }}
    >
      {links.map((name, i) => (
        <li key={name} style={{ display: "contents" }}>
          {i > 0 && (
            <span className="evo-arrow" aria-hidden="true">
              →
            </span>
          )}
          <Link to="/pokemon/$name" params={{ name }} className="evo-link">
            {titleCase(name)}
          </Link>
        </li>
      ))}
    </ol>
  );
}

function PokemonDetailContent({ name }: { name: string }) {
  const { data: pokemon } = useSuspenseQuery(pokemonQuery(name));
  const { data: species } = useQuery(speciesQuery(pokemon.species.name));

  const art =
    pokemon.sprites.other?.["official-artwork"]?.front_default || pokemon.sprites.front_default;
  const flavor = species ? englishEntry(species.flavor_text_entries) : undefined;
  const genus = species ? englishEntry(species.genera) : undefined;

  return (
    <article className="detail">
      <aside className="detail__hero" aria-label="Pokémon summary">
        <div className="detail__id">{padId(pokemon.id)}</div>
        <h1 className="detail__name">{titleCase(pokemon.name)}</h1>
        {genus && (
          <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{genus.genus}</div>
        )}
        <div className="detail__sprite">
          <Sprite src={art} alt={`${pokemon.name} artwork`} size={280} priority />
        </div>
        <div className="detail__types" aria-label="Types">
          {pokemon.types.map((t) => (
            <TypeBadge key={t.type.name} name={t.type.name} />
          ))}
        </div>
      </aside>

      <div className="detail__body">
        {flavor && (
          <section className="panel" aria-labelledby="flavor-heading">
            <h2 id="flavor-heading">Pokédex entry</h2>
            <p style={{ margin: 0 }}>{cleanFlavor(flavor.flavor_text)}</p>
          </section>
        )}

        <section className="panel" aria-labelledby="profile-heading">
          <h2 id="profile-heading">Profile</h2>
          <dl className="meta">
            <div>
              <dt>Height</dt>
              <dd>{decimetersToMeters(pokemon.height)}</dd>
            </div>
            <div>
              <dt>Weight</dt>
              <dd>{hectogramsToKg(pokemon.weight)}</dd>
            </div>
            <div>
              <dt>Base EXP</dt>
              <dd>{pokemon.base_experience}</dd>
            </div>
            {species && (
              <>
                <div>
                  <dt>Capture rate</dt>
                  <dd>{species.capture_rate}</dd>
                </div>
                <div>
                  <dt>Base happiness</dt>
                  <dd>{species.base_happiness}</dd>
                </div>
                <div>
                  <dt>Color</dt>
                  <dd>{species.color.name}</dd>
                </div>
                <div>
                  <dt>Generation</dt>
                  <dd>{species.generation.name.replace("generation-", "")}</dd>
                </div>
                <div>
                  <dt>Growth rate</dt>
                  <dd>{species.growth_rate.name}</dd>
                </div>
              </>
            )}
          </dl>
        </section>

        <section className="panel" aria-labelledby="stats-heading">
          <h2 id="stats-heading">Base stats</h2>
          {pokemon.stats.map((s) => (
            <StatBar key={s.stat.name} name={s.stat.name} value={s.base_stat} />
          ))}
        </section>

        <section className="panel" aria-labelledby="abilities-heading">
          <h2 id="abilities-heading">Abilities</h2>
          <ul className="pill-list">
            {pokemon.abilities.map((a) => (
              <li key={a.ability.name}>
                <Link to="/ability/$id" params={{ id: a.ability.name }} className="pill">
                  {titleCase(a.ability.name)}
                  {a.is_hidden && (
                    <span style={{ color: "var(--text-muted)", fontSize: "0.75em" }}>
                      {" "}
                      (hidden)
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {species?.evolution_chain?.url && (
          <section className="panel" aria-labelledby="evo-heading">
            <h2 id="evo-heading">Evolution</h2>
            <Suspense
              fallback={<div className="skeleton" style={{ height: "2rem" }} aria-busy="true" />}
            >
              <EvolutionChain chainUrl={species.evolution_chain.url} />
            </Suspense>
          </section>
        )}

        <section className="panel" aria-labelledby="species-heading">
          <h2 id="species-heading">Related</h2>
          <ul className="pill-list">
            <li>
              <Link
                to="/pokemon-species/$id"
                params={{ id: pokemon.species.name }}
                className="pill"
              >
                Species: {titleCase(pokemon.species.name)}
              </Link>
            </li>
            {pokemon.forms.map((f) => (
              <li key={f.name}>
                <Link to="/pokemon-form/$id" params={{ id: f.name }} className="pill">
                  Form: {titleCase(f.name)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}

function DetailSkeleton() {
  return (
    <div className="detail" aria-busy="true" aria-label="Loading Pokémon">
      <div className="detail__hero">
        <div className="skeleton" style={{ height: "1rem", width: "30%", margin: "0 auto" }} />
        <div className="skeleton" style={{ height: "2rem", width: "60%", margin: "0.5rem auto" }} />
        <div className="skeleton" style={{ aspectRatio: "1", marginBlock: "1rem" }} />
        <div className="skeleton" style={{ height: "1.4rem", width: "70%", margin: "0 auto" }} />
      </div>
      <div className="detail__body" style={{ display: "grid", gap: "1rem" }}>
        <div className="skeleton" style={{ height: "8rem" }} />
        <div className="skeleton" style={{ height: "12rem" }} />
      </div>
    </div>
  );
}

export function PokemonDetailPage() {
  const { name } = pokemonRoute.useParams();
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <PokemonDetailContent name={name.toLowerCase()} />
    </Suspense>
  );
}
