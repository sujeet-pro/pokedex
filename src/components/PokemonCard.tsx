import { Link } from "@tanstack/react-router";
import type { PokemonIndexEntry } from "~/types/bundles";
import type { Locale } from "~/types/locales";
import { TypeCartridge } from "./TypeCartridge";
import { padDex } from "~/lib/formatters";
import { pokemonArtwork } from "~/lib/sprites";

type Props = { entry: PokemonIndexEntry; locale: Locale };

export function PokemonCard({ entry, locale }: Props) {
  const sprite = pokemonArtwork(entry.id);
  return (
    <Link
      to="/$lang/pokemon/$name"
      params={{ lang: locale, name: entry.slug }}
      className="pokemon-card"
    >
      <div className="pokemon-card__sprite">
        <img src={sprite} alt="" loading="lazy" width={192} height={192} />
      </div>
      <div className="pokemon-card__id">{padDex(entry.id)}</div>
      <div className="pokemon-card__name">{entry.display_name}</div>
      <ul className="pokemon-card__types pill-list" aria-label="Types">
        {entry.types.map((t) => (
          <li key={t}>
            <TypeCartridge name={t} size="sm" />
          </li>
        ))}
      </ul>
    </Link>
  );
}
