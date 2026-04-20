import { queryOptions } from "@tanstack/react-query";
import { api } from "./client";
import type {
  AbilityDetail,
  EvolutionChain,
  PaginatedList,
  Pokemon,
  PokemonForm,
  PokemonSpecies,
  TypeDetail,
} from "~/types/pokeapi";

const HOUR = 60 * 60 * 1000;

export const listPokemonQuery = (limit = 1025) =>
  queryOptions({
    queryKey: ["pokemon-list", limit] as const,
    queryFn: ({ signal }) =>
      api.get<PaginatedList>(`/pokemon?limit=${limit}&offset=0`, signal),
    staleTime: 24 * HOUR,
    gcTime: 24 * HOUR,
  });

export const pokemonQuery = (idOrName: string | number) =>
  queryOptions({
    queryKey: ["pokemon", String(idOrName)] as const,
    queryFn: ({ signal }) => api.get<Pokemon>(`/pokemon/${idOrName}`, signal),
    staleTime: HOUR,
  });

export const speciesQuery = (idOrName: string | number) =>
  queryOptions({
    queryKey: ["species", String(idOrName)] as const,
    queryFn: ({ signal }) => api.get<PokemonSpecies>(`/pokemon-species/${idOrName}`, signal),
    staleTime: HOUR,
  });

export const typeQuery = (idOrName: string | number) =>
  queryOptions({
    queryKey: ["type", String(idOrName)] as const,
    queryFn: ({ signal }) => api.get<TypeDetail>(`/type/${idOrName}`, signal),
    staleTime: HOUR,
  });

export const abilityQuery = (idOrName: string | number) =>
  queryOptions({
    queryKey: ["ability", String(idOrName)] as const,
    queryFn: ({ signal }) => api.get<AbilityDetail>(`/ability/${idOrName}`, signal),
    staleTime: HOUR,
  });

export const formQuery = (idOrName: string | number) =>
  queryOptions({
    queryKey: ["pokemon-form", String(idOrName)] as const,
    queryFn: ({ signal }) => api.get<PokemonForm>(`/pokemon-form/${idOrName}`, signal),
    staleTime: HOUR,
  });

export const evolutionChainByUrlQuery = (url: string | null | undefined) =>
  queryOptions({
    queryKey: ["evolution-chain", url ?? ""] as const,
    queryFn: ({ signal }) => {
      if (!url) throw new Error("No evolution-chain url");
      return api.get<EvolutionChain>(url, signal);
    },
    enabled: Boolean(url),
    staleTime: 24 * HOUR,
  });
