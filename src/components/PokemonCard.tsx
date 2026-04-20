import { Link } from "@tanstack/react-router";
import type { PokemonIndexEntry } from "~/types/bundles";
import type { Locale } from "~/types/locales";
import { TypeCartridge } from "./TypeCartridge";
import { padDex } from "~/lib/formatters";

type Props = { entry: PokemonIndexEntry; locale: Locale };

const SPRITE_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

export function PokemonCard({ entry, locale }: Props) {
  const sprite = `${SPRITE_BASE}/${entry.id}.png`;
  return (
    <Link
      to="/$lang/pokemon/$name"
      params={{ lang: locale, name: entry.name }}
      className="pokemon-card"
    >
      <div className="pokemon-card-sprite">
        <img src={sprite} alt="" loading="lazy" width={96} height={96} />
      </div>
      <div className="pokemon-card-dex">{padDex(entry.id)}</div>
      <div className="pokemon-card-name">{entry.display_name}</div>
      <div className="pokemon-card-types">
        {entry.types.map((t) => (
          <TypeCartridge key={t} name={t} />
        ))}
      </div>
    </Link>
  );
}
