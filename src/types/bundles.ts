import type { Locale } from "./locales";

export type ResourceKind =
  | "pokemon"
  | "pokemon-species"
  | "pokemon-form"
  | "type"
  | "ability"
  | "berry"
  | "item"
  | "move"
  | "location"
  | "generation";

export type BundleAbilityEntry = {
  name: string;
  display_name: string;
  is_hidden: boolean;
  slot: number;
  short_effect_html: string;
};

export type BundleEvoNode = {
  name: string;
  id: number;
  display_name: string;
  trigger: string;
  evolves_to: BundleEvoNode[];
};

export type BundleDefenderType = {
  name: string;
  no_damage_from: string[];
  double_damage_from: string[];
  half_damage_from: string[];
};

export type PokemonBundleSpecies = {
  name: string;
  display_name: string;
  genus: string;
  generation: string;
  capture_rate: number;
  base_happiness: number;
  hatch_counter: number | null;
  color: string;
  shape: string | null;
  habitat: string | null;
  growth_rate: string;
  egg_groups: string[];
  is_legendary: boolean;
  is_mythical: boolean;
  is_baby: boolean;
  flavor_html: string;
};

export type PokemonBundle = {
  kind: "pokemon";
  id: number;
  name: string;
  display_name: string;
  order: number;
  height: number;
  weight: number;
  base_experience: number;
  types: { slot: number; name: string }[];
  stats: { name: string; base_stat: number }[];
  sprites: { front_default: string | null; official_artwork: string | null };
  abilities: BundleAbilityEntry[];
  forms: { name: string; display_name: string }[];
  species: PokemonBundleSpecies;
  evolution_chain: BundleEvoNode | null;
  defenders: BundleDefenderType[];
  pager: {
    prev: { name: string; id: number } | null;
    next: { name: string; id: number } | null;
  };
  summary_html: string | null;
};

export type PokemonIndexEntry = {
  id: number;
  name: string;
  display_name: string;
  types: string[];
};

export type IndexBundle<E, Kind extends string> = {
  kind: Kind;
  locale: Locale;
  total: number;
  entries: E[];
};

export type PokemonIndexBundle = IndexBundle<PokemonIndexEntry, "pokemon-index">;
