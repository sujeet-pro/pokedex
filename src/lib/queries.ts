import { queryOptions } from "@tanstack/react-query";
import type { Locale } from "~/types/locales";
import type { PokemonBundle, PokemonIndexBundle } from "~/types/bundles";
import { fetchBundle, fetchIndex } from "./bundles";

const IMMORTAL = { staleTime: Infinity, gcTime: Infinity } as const;

export function pokemonIndexQuery(lang: Locale) {
  return queryOptions({
    queryKey: ["bundle", "pokemon-index", lang] as const,
    queryFn: ({ signal }) => fetchIndex<PokemonIndexBundle>("pokemon", lang, signal),
    ...IMMORTAL,
  });
}

export function pokemonBundleQuery(lang: Locale, slug: string) {
  return queryOptions({
    queryKey: ["bundle", "pokemon", lang, slug] as const,
    queryFn: ({ signal }) => fetchBundle<PokemonBundle>("pokemon", lang, slug, signal),
    ...IMMORTAL,
  });
}
