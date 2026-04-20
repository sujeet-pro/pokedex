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

export type NamedEntry = {
  name: string;
  display_name: string;
  id: number;
};

/* ---------- Pokémon ---------- */

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

/* ---------- Type ---------- */

export type TypeBundle = {
  kind: "type";
  id: number;
  name: string;
  display_name: string;
  generation: string;
  relations: {
    double_damage_to: string[];
    half_damage_to: string[];
    no_damage_to: string[];
    double_damage_from: string[];
    half_damage_from: string[];
    no_damage_from: string[];
  };
  pokemon: { name: string; display_name: string; id: number; slot: number }[];
};

export type TypeIndexEntry = {
  id: number;
  name: string;
  display_name: string;
  generation: string;
};

/* ---------- Ability ---------- */

export type AbilityBundle = {
  kind: "ability";
  id: number;
  name: string;
  display_name: string;
  generation: string;
  short_effect_html: string | null;
  effect_html: string | null;
  flavor_html: string | null;
  pokemon: { name: string; display_name: string; id: number; is_hidden: boolean }[];
};

export type AbilityIndexEntry = {
  id: number;
  name: string;
  display_name: string;
  generation: string;
};

/* ---------- Pokémon Species (standalone detail) ---------- */

export type SpeciesBundle = {
  kind: "pokemon-species";
  id: number;
  name: string;
  display_name: string;
  genus: string;
  generation: string;
  color: string;
  shape: string | null;
  habitat: string | null;
  growth_rate: string;
  egg_groups: string[];
  capture_rate: number;
  base_happiness: number;
  hatch_counter: number | null;
  is_legendary: boolean;
  is_mythical: boolean;
  is_baby: boolean;
  flavor_html: string;
  varieties: { name: string; display_name: string; is_default: boolean }[];
};

/* ---------- Pokémon Form ---------- */

export type FormBundle = {
  kind: "pokemon-form";
  id: number;
  name: string;
  display_name: string;
  form_name: string;
  is_default: boolean;
  is_mega: boolean;
  is_battle_only: boolean;
  types: string[];
  pokemon: { name: string; display_name: string; id: number };
  version_group: string;
  sprite: string | null;
};

/* ---------- Berry ---------- */

export type BerryBundle = {
  kind: "berry";
  id: number;
  name: string;
  display_name: string;
  firmness: string;
  growth_time: number;
  max_harvest: number;
  size: number;
  smoothness: number;
  soil_dryness: number;
  natural_gift_power: number;
  natural_gift_type: string;
  flavors: { name: string; potency: number }[];
  item: { name: string; display_name: string };
};

export type BerryIndexEntry = {
  id: number;
  name: string;
  display_name: string;
  firmness: string;
  natural_gift_type: string;
};

/* ---------- Item ---------- */

export type ItemBundle = {
  kind: "item";
  id: number;
  name: string;
  display_name: string;
  cost: number;
  category: string;
  category_display: string;
  attributes: string[];
  fling_power: number | null;
  fling_effect: string | null;
  short_effect_html: string | null;
  effect_html: string | null;
  flavor_html: string | null;
  sprite: string | null;
  held_by: { name: string; display_name: string; id: number }[];
};

export type ItemIndexEntry = {
  id: number;
  name: string;
  display_name: string;
  category: string;
  cost: number;
};

/* ---------- Move ---------- */

export type MoveBundle = {
  kind: "move";
  id: number;
  name: string;
  display_name: string;
  type: string;
  damage_class: string;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  priority: number;
  target: string;
  generation: string;
  short_effect_html: string | null;
  effect_html: string | null;
  flavor_html: string | null;
  learned_by: { name: string; display_name: string; id: number }[];
};

export type MoveIndexEntry = {
  id: number;
  name: string;
  display_name: string;
  type: string;
  damage_class: string;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
};

/* ---------- Location (with inline areas) ---------- */

export type LocationAreaInline = {
  name: string;
  display_name: string;
};

export type LocationBundle = {
  kind: "location";
  id: number;
  name: string;
  display_name: string;
  region: string;
  areas: LocationAreaInline[];
};

export type LocationIndexEntry = {
  id: number;
  name: string;
  display_name: string;
  region: string;
  area_count: number;
  areas: LocationAreaInline[];
};

/* ---------- Generation ---------- */

export type GenerationBundle = {
  kind: "generation";
  id: number;
  name: string;
  display_name: string;
  main_region: string;
  version_groups: string[];
  counts: {
    species: number;
    moves: number;
    abilities: number;
    types: number;
  };
  species: { name: string; display_name: string; id: number }[];
  moves: { name: string; display_name: string }[];
  abilities: { name: string; display_name: string }[];
  types: { name: string; display_name: string }[];
};

export type GenerationIndexEntry = {
  id: number;
  name: string;
  display_name: string;
  main_region: string;
  species_count: number;
};

/* ---------- Search index ---------- */

export type SearchIndexEntry = {
  kind: ResourceKind;
  name: string;
  id: number;
  display_name: string;
  tag?: string;
};

export type SearchIndexBundle = {
  kind: "search-index";
  locale: Locale;
  total: number;
  entries: SearchIndexEntry[];
};

/* ---------- Index bundle wrapper ---------- */

export type IndexBundle<E, Kind extends string> = {
  kind: Kind;
  locale: Locale;
  total: number;
  entries: E[];
};

export type PokemonIndexBundle = IndexBundle<PokemonIndexEntry, "pokemon-index">;
export type TypeIndexBundle = IndexBundle<TypeIndexEntry, "type-index">;
export type AbilityIndexBundle = IndexBundle<AbilityIndexEntry, "ability-index">;
export type BerryIndexBundle = IndexBundle<BerryIndexEntry, "berry-index">;
export type ItemIndexBundle = IndexBundle<ItemIndexEntry, "item-index">;
export type MoveIndexBundle = IndexBundle<MoveIndexEntry, "move-index">;
export type LocationIndexBundle = IndexBundle<LocationIndexEntry, "location-index">;
export type GenerationIndexBundle = IndexBundle<GenerationIndexEntry, "generation-index">;
