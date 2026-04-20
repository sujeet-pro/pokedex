import { Link } from "@tanstack/react-router";
import type { Pokemon } from "~/types/pokeapi";
import { padId } from "~/utils/formatters";
import { Sprite } from "./Sprite";
import { TypeBadge } from "./TypeBadge";

type Props = { pokemon: Pokemon };

export function PokemonCard({ pokemon }: Props) {
  const art =
    pokemon.sprites.other?.["official-artwork"]?.front_default || pokemon.sprites.front_default;
  return (
    <Link
      to="/pokemon/$name"
      params={{ name: pokemon.name }}
      className="pokemon-card"
      aria-label={`${pokemon.name}, ${padId(pokemon.id)}`}
    >
      <div className="pokemon-card__sprite">
        <Sprite src={art} alt="" size={192} />
      </div>
      <div>
        <div className="pokemon-card__id">{padId(pokemon.id)}</div>
        <div className="pokemon-card__name">{pokemon.name}</div>
        <div className="pokemon-card__types">
          {pokemon.types.map((t) => (
            <TypeBadge key={t.type.name} name={t.type.name} asLink={false} />
          ))}
        </div>
      </div>
    </Link>
  );
}

export function PokemonCardSkeleton() {
  return (
    <div className="pokemon-card" aria-busy="true" aria-label="Loading Pokémon">
      <div className="skeleton" style={{ aspectRatio: "1", borderRadius: "var(--radius-md)" }} />
      <div style={{ display: "grid", gap: "0.4rem", marginTop: "0.5rem" }}>
        <div className="skeleton" style={{ height: "0.8rem", width: "30%", margin: "0 auto" }} />
        <div className="skeleton" style={{ height: "1.1rem", width: "60%", margin: "0 auto" }} />
        <div className="skeleton" style={{ height: "1.4rem", width: "70%", margin: "0 auto" }} />
      </div>
    </div>
  );
}
