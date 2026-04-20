import { queryOptions } from "@tanstack/react-query";
import { bundles, loadText } from "./client";
import type {
  AbilityBundle,
  AbilityIndexBundle,
  BerryBundle,
  BerryIndexBundle,
  FormBundle,
  GenerationBundle,
  GenerationIndexBundle,
  ItemBundle,
  ItemIndexBundle,
  LocationBundle,
  LocationIndexBundle,
  MoveBundle,
  MoveIndexBundle,
  PokemonBundle,
  PokemonIndexBundle,
  SearchIndexBundle,
  SpeciesBundle,
  TypeBundle,
  TypeIndexBundle,
} from "~/types/bundles";

// Bundles are deploy-time artifacts — the only time they change is when the
// site is rebuilt and redeployed. So cache forever.
const FOREVER = { staleTime: Infinity, gcTime: Infinity } as const;

export const pokemonIndexQuery = () =>
  queryOptions({
    queryKey: ["bundle", "pokemon", "_index"] as const,
    queryFn: ({ signal }) => bundles.get<PokemonIndexBundle>("/pokemon/_index.json", signal),
    ...FOREVER,
  });

export const pokemonBundleQuery = (name: string) =>
  queryOptions({
    queryKey: ["bundle", "pokemon", name] as const,
    queryFn: ({ signal }) => bundles.get<PokemonBundle>(`/pokemon/${name}.json`, signal),
    ...FOREVER,
  });

export const typeBundleQuery = (name: string) =>
  queryOptions({
    queryKey: ["bundle", "type", name] as const,
    queryFn: ({ signal }) => bundles.get<TypeBundle>(`/type/${name}.json`, signal),
    ...FOREVER,
  });

export const typeIndexQuery = () =>
  queryOptions({
    queryKey: ["bundle", "type", "_index"] as const,
    queryFn: ({ signal }) => bundles.get<TypeIndexBundle>("/type/_index.json", signal),
    ...FOREVER,
  });

export const abilityBundleQuery = (name: string) =>
  queryOptions({
    queryKey: ["bundle", "ability", name] as const,
    queryFn: ({ signal }) => bundles.get<AbilityBundle>(`/ability/${name}.json`, signal),
    ...FOREVER,
  });

export const abilityIndexQuery = () =>
  queryOptions({
    queryKey: ["bundle", "ability", "_index"] as const,
    queryFn: ({ signal }) => bundles.get<AbilityIndexBundle>("/ability/_index.json", signal),
    ...FOREVER,
  });

export const speciesBundleQuery = (name: string) =>
  queryOptions({
    queryKey: ["bundle", "pokemon-species", name] as const,
    queryFn: ({ signal }) =>
      bundles.get<SpeciesBundle>(`/pokemon-species/${name}.json`, signal),
    ...FOREVER,
  });

export const formBundleQuery = (name: string) =>
  queryOptions({
    queryKey: ["bundle", "pokemon-form", name] as const,
    queryFn: ({ signal }) => bundles.get<FormBundle>(`/pokemon-form/${name}.json`, signal),
    ...FOREVER,
  });

export const pokemonSummaryQuery = (id: number) =>
  queryOptions({
    queryKey: ["summary", "pokemon", id, "en"] as const,
    queryFn: ({ signal }) => loadText(`/summary/${id}_en.txt`, signal),
    ...FOREVER,
  });

// ── Phase 2 resources ────────────────────────────────────────────────

export const berryIndexQuery = () =>
  queryOptions({
    queryKey: ["bundle", "berry", "_index"] as const,
    queryFn: ({ signal }) => bundles.get<BerryIndexBundle>("/berry/_index.json", signal),
    ...FOREVER,
  });

export const berryBundleQuery = (name: string) =>
  queryOptions({
    queryKey: ["bundle", "berry", name] as const,
    queryFn: ({ signal }) => bundles.get<BerryBundle>(`/berry/${name}.json`, signal),
    ...FOREVER,
  });

export const itemIndexQuery = () =>
  queryOptions({
    queryKey: ["bundle", "item", "_index"] as const,
    queryFn: ({ signal }) => bundles.get<ItemIndexBundle>("/item/_index.json", signal),
    ...FOREVER,
  });

export const itemBundleQuery = (name: string) =>
  queryOptions({
    queryKey: ["bundle", "item", name] as const,
    queryFn: ({ signal }) => bundles.get<ItemBundle>(`/item/${name}.json`, signal),
    ...FOREVER,
  });

export const locationIndexQuery = () =>
  queryOptions({
    queryKey: ["bundle", "location", "_index"] as const,
    queryFn: ({ signal }) => bundles.get<LocationIndexBundle>("/location/_index.json", signal),
    ...FOREVER,
  });

export const locationBundleQuery = (name: string) =>
  queryOptions({
    queryKey: ["bundle", "location", name] as const,
    queryFn: ({ signal }) => bundles.get<LocationBundle>(`/location/${name}.json`, signal),
    ...FOREVER,
  });

export const moveIndexQuery = () =>
  queryOptions({
    queryKey: ["bundle", "move", "_index"] as const,
    queryFn: ({ signal }) => bundles.get<MoveIndexBundle>("/move/_index.json", signal),
    ...FOREVER,
  });

export const moveBundleQuery = (name: string) =>
  queryOptions({
    queryKey: ["bundle", "move", name] as const,
    queryFn: ({ signal }) => bundles.get<MoveBundle>(`/move/${name}.json`, signal),
    ...FOREVER,
  });

export const generationIndexQuery = () =>
  queryOptions({
    queryKey: ["bundle", "generation", "_index"] as const,
    queryFn: ({ signal }) =>
      bundles.get<GenerationIndexBundle>("/generation/_index.json", signal),
    ...FOREVER,
  });

export const generationBundleQuery = (name: string) =>
  queryOptions({
    queryKey: ["bundle", "generation", name] as const,
    queryFn: ({ signal }) => bundles.get<GenerationBundle>(`/generation/${name}.json`, signal),
    ...FOREVER,
  });

// ── Unified search ───────────────────────────────────────────────────

export const searchIndexQuery = () =>
  queryOptions({
    queryKey: ["bundle", "search-index"] as const,
    queryFn: ({ signal }) => bundles.get<SearchIndexBundle>("/search-index.json", signal),
    ...FOREVER,
  });
