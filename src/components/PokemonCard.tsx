import { Link } from "@tanstack/react-router";
import type { Pokemon } from "~/types/pokeapi";
import { padId, titleCase } from "~/utils/formatters";
import { Sprite } from "./Sprite";
import { TypeCartridge } from "./TypeCartridge";

type Props = { pokemon: Pokemon };

export function PokemonCard({ pokemon }: Props) {
  const art =
    pokemon.sprites.other?.["official-artwork"]?.front_default || pokemon.sprites.front_default;
  return (
    <Link
      to="/pokemon/$name"
      params={{ name: pokemon.name }}
      className="pokemon-card"
      aria-label={`${titleCase(pokemon.name)}, ${padId(pokemon.id)}`}
    >
      <div className="pokemon-card__sprite">
        <Sprite src={art} alt="" />
      </div>
      <div className="pokemon-card__id">{padId(pokemon.id)}</div>
      <div className="pokemon-card__name">{titleCase(pokemon.name)}</div>
      <div className="pokemon-card__types">
        {pokemon.types.map((t) => (
          <TypeCartridge key={t.type.name} name={t.type.name} asLink={false} size="sm" />
        ))}
      </div>
    </Link>
  );
}

export function PokemonCardSkeleton() {
  return (
    <div className="pokemon-card" aria-busy="true" aria-label="Loading Pokémon">
      <div className="skeleton" style={{ aspectRatio: "1", borderRadius: "var(--radius-sm)" }} />
      <div
        className="skeleton"
        style={{ height: "0.7rem", width: "40%", margin: "0.5rem auto 0" }}
      />
      <div className="skeleton" style={{ height: "0.9rem", width: "65%", margin: "0.3rem auto" }} />
    </div>
  );
}
