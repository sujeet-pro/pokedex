import { queryOptions } from "@tanstack/react-query";
import type { Locale } from "~/types/locales";
import type {
  PokemonBundle, PokemonIndexBundle,
  TypeBundle, TypeIndexBundle,
  AbilityBundle, AbilityIndexBundle,
  BerryBundle, BerryIndexBundle,
  ItemBundle, ItemIndexBundle,
  MoveBundle, MoveIndexBundle,
  LocationIndexBundle,
  GenerationBundle, GenerationIndexBundle,
  SpeciesBundle, FormBundle,
  SearchIndexBundle,
} from "~/types/bundles";
import { fetchBundle, fetchIndex } from "./bundles";

const IMMORTAL = { staleTime: Infinity, gcTime: Infinity } as const;

function bundleQuery<T>(resource: string, lang: Locale, slug: string) {
  return queryOptions({
    queryKey: ["bundle", resource, lang, slug] as const,
    queryFn: ({ signal }) => fetchBundle<T>(resource, lang, slug, signal),
    ...IMMORTAL,
  });
}

function indexQuery<T>(resource: string, lang: Locale) {
  return queryOptions({
    queryKey: ["bundle", `${resource}-index`, lang] as const,
    queryFn: ({ signal }) => fetchIndex<T>(resource, lang, signal),
    ...IMMORTAL,
  });
}

export const pokemonIndexQuery = (l: Locale) => indexQuery<PokemonIndexBundle>("pokemon", l);
export const pokemonBundleQuery = (l: Locale, s: string) => bundleQuery<PokemonBundle>("pokemon", l, s);

export const typeIndexQuery = (l: Locale) => indexQuery<TypeIndexBundle>("type", l);
export const typeBundleQuery = (l: Locale, s: string) => bundleQuery<TypeBundle>("type", l, s);

export const abilityIndexQuery = (l: Locale) => indexQuery<AbilityIndexBundle>("ability", l);
export const abilityBundleQuery = (l: Locale, s: string) => bundleQuery<AbilityBundle>("ability", l, s);

export const speciesBundleQuery = (l: Locale, s: string) => bundleQuery<SpeciesBundle>("pokemon-species", l, s);
export const formBundleQuery = (l: Locale, s: string) => bundleQuery<FormBundle>("pokemon-form", l, s);

export const berryIndexQuery = (l: Locale) => indexQuery<BerryIndexBundle>("berry", l);
export const berryBundleQuery = (l: Locale, s: string) => bundleQuery<BerryBundle>("berry", l, s);

export const itemIndexQuery = (l: Locale) => indexQuery<ItemIndexBundle>("item", l);
export const itemBundleQuery = (l: Locale, s: string) => bundleQuery<ItemBundle>("item", l, s);

export const moveIndexQuery = (l: Locale) => indexQuery<MoveIndexBundle>("move", l);
export const moveBundleQuery = (l: Locale, s: string) => bundleQuery<MoveBundle>("move", l, s);

export const locationIndexQuery = (l: Locale) => indexQuery<LocationIndexBundle>("location", l);

export const generationIndexQuery = (l: Locale) => indexQuery<GenerationIndexBundle>("generation", l);
export const generationBundleQuery = (l: Locale, s: string) => bundleQuery<GenerationBundle>("generation", l, s);

export const searchIndexQuery = (l: Locale) =>
  queryOptions({
    queryKey: ["bundle", "search-index", l] as const,
    queryFn: ({ signal }) => fetchIndex<SearchIndexBundle>("search", l, signal),
    ...IMMORTAL,
  });
