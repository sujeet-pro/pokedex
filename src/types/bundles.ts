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

/** Locale-keyed slug map used for cross-locale URL switching. */
export type SlugMap = Record<Locale, string>;

/** A lightweight reference to another entity, with slug for the current locale. */
export type NamedRef = {
  id: number;
  name: string;           // canonical PokéAPI slug (language-neutral)
  slug: string;           // current-locale URL slug
  display_name: string;
};

/* ---------- Pokémon ---------- */

export type BundleAbilityEntry = {
  name: string;           // canonical PokéAPI slug
  slug: string;           // current-locale URL slug
  display_name: string;
  is_hidden: boolean;
  slot: number;
  short_effect_html: string;
};

export type BundleEvoNode = {
  name: string;
  slug: string;
  id: number;
  display_name: string;
  trigger: string;
  evolves_to: BundleEvoNode[];
};

export type BundleDefenderType = {
  name: string;           // canonical type slug
  slug: string;           // locale-specific type slug
  display_name: string;
  no_damage_from: string[];      // canonical slugs (used as keys)
  double_damage_from: string[];
  half_damage_from: string[];
};

export type PokemonBundleSpecies = {
  name: string;
  slug: string;
  slugs: SlugMap;
  display_name: string;
  genus: string;
  generation: string;              // canonical
  generation_display: string;      // localized
  capture_rate: number;
  base_happiness: number;
  hatch_counter: number | null;
  color: string;
  color_display: string;
  shape: string | null;
  shape_display: string | null;
  habitat: string | null;
  habitat_display: string | null;
  growth_rate: string;
  growth_rate_display: string;
  egg_groups: string[];
  egg_groups_display: string[];
  is_legendary: boolean;
  is_mythical: boolean;
  is_baby: boolean;
  flavor_html: string;
  flavor_text: string;             // plain text, for SpeakButton
};

export type PokemonBundle = {
  kind: "pokemon";
  id: number;
  name: string;                    // canonical PokéAPI slug
  slug: string;                    // current-locale URL slug
  slugs: SlugMap;                  // for locale switching
  display_name: string;
  order: number;
  height: number;
  weight: number;
  base_experience: number;
  types: { slot: number; name: string; slug: string; display_name: string }[];
  stats: { name: string; base_stat: number }[];
  stats_total: number;
  sprites: { front_default: string | null; official_artwork: string | null };
  abilities: BundleAbilityEntry[];
  forms: { name: string; slug: string; display_name: string; id: number }[];
  species: PokemonBundleSpecies;
  evolution_chain: BundleEvoNode | null;
  defenders: BundleDefenderType[];
  pager: {
    prev: { name: string; slug: string; id: number; display_name: string } | null;
    next: { name: string; slug: string; id: number; display_name: string } | null;
  };
  summary_html: string | null;
};

export type PokemonIndexEntry = {
  id: number;
  name: string;                    // canonical
  slug: string;                    // current-locale
  slugs: SlugMap;                  // cross-locale for card locale-switching
  display_name: string;
  types: string[];                 // canonical slugs
};

/* ---------- Type ---------- */

export type TypeBundle = {
  kind: "type";
  id: number;
  name: string;
  slug: string;
  slugs: SlugMap;
  display_name: string;
  generation: string;
  generation_display: string;
  relations: {
    double_damage_to: NamedRef[];
    half_damage_to: NamedRef[];
    no_damage_to: NamedRef[];
    double_damage_from: NamedRef[];
    half_damage_from: NamedRef[];
    no_damage_from: NamedRef[];
  };
  pokemon: { name: string; slug: string; display_name: string; id: number; slot: number }[];
};

export type TypeIndexEntry = {
  id: number;
  name: string;
  slug: string;
  slugs: SlugMap;
  display_name: string;
  generation: string;
};

/* ---------- Ability ---------- */

export type AbilityBundle = {
  kind: "ability";
  id: number;
  name: string;
  slug: string;
  slugs: SlugMap;
  display_name: string;
  generation: string;
  generation_display: string;
  short_effect_html: string | null;
  effect_html: string | null;
  flavor_html: string | null;
  pokemon: { name: string; slug: string; display_name: string; id: number; is_hidden: boolean }[];
};

export type AbilityIndexEntry = {
  id: number;
  name: string;
  slug: string;
  slugs: SlugMap;
  display_name: string;
  generation: string;
};

/* ---------- Pokémon Species ---------- */

export type SpeciesBundle = {
  kind: "pokemon-species";
  id: number;
  name: string;
  slug: string;
  slugs: SlugMap;
  display_name: string;
  genus: string;
  generation: string;
  generation_display: string;
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
  varieties: { name: string; slug: string; display_name: string; is_default: boolean }[];
};

/* ---------- Pokémon Form ---------- */

export type FormBundle = {
  kind: "pokemon-form";
  id: number;
  name: string;
  slug: string;
  slugs: SlugMap;
  display_name: string;
  form_name: string;
  is_default: boolean;
  is_mega: boolean;
  is_battle_only: boolean;
  types: string[];
  pokemon: { name: string; slug: string; display_name: string; id: number };
  version_group: string;
  sprite: string | null;
};

/* ---------- Berry ---------- */

export type BerryBundle = {
  kind: "berry";
  id: number;
  name: string;
  slug: string;
  slugs: SlugMap;
  display_name: string;
  firmness: string;
  firmness_display: string;
  growth_time: number;
  max_harvest: number;
  size: number;
  smoothness: number;
  soil_dryness: number;
  natural_gift_power: number;
  natural_gift_type: string;
  flavors: { name: string; potency: number }[];
  item: { name: string; slug: string; display_name: string };
};

export type BerryIndexEntry = {
  id: number;
  name: string;
  slug: string;
  slugs: SlugMap;
  display_name: string;
  firmness: string;
  natural_gift_type: string;
};

/* ---------- Item ---------- */

export type ItemBundle = {
  kind: "item";
  id: number;
  name: string;
  slug: string;
  slugs: SlugMap;
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
  held_by: { name: string; slug: string; display_name: string; id: number }[];
};

export type ItemIndexEntry = {
  id: number;
  name: string;
  slug: string;
  slugs: SlugMap;
  display_name: string;
  category: string;
  cost: number;
};

/* ---------- Move ---------- */

export type MoveBundle = {
  kind: "move";
  id: number;
  name: string;
  slug: string;
  slugs: SlugMap;
  display_name: string;
  type: string;
  type_slug: string;
  type_display: string;
  damage_class: string;
  damage_class_display: string;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  priority: number;
  target: string;
  generation: string;
  short_effect_html: string | null;
  effect_html: string | null;
  flavor_html: string | null;
  learned_by: { name: string; slug: string; display_name: string; id: number }[];
};

export type MoveIndexEntry = {
  id: number;
  name: string;
  slug: string;
  slugs: SlugMap;
  display_name: string;
  type: string;
  damage_class: string;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
};

/* ---------- Location (inline-expanded areas) ---------- */

export type LocationAreaInline = {
  name: string;
  display_name: string;
};

export type LocationIndexEntry = {
  id: number;
  name: string;
  slug: string;
  slugs: SlugMap;
  display_name: string;
  region: string;
  region_display: string;
  area_count: number;
  areas: LocationAreaInline[];
};

/* ---------- Generation ---------- */

export type GenerationBundle = {
  kind: "generation";
  id: number;
  name: string;
  slug: string;
  slugs: SlugMap;
  display_name: string;
  main_region: string;
  main_region_display: string;
  version_groups: string[];
  counts: { species: number; moves: number; abilities: number; types: number };
  species: { name: string; slug: string; display_name: string; id: number }[];
  moves: { name: string; slug: string; display_name: string }[];
  abilities: { name: string; slug: string; display_name: string }[];
  types: { name: string; slug: string; display_name: string }[];
};

export type GenerationIndexEntry = {
  id: number;
  name: string;
  slug: string;
  slugs: SlugMap;
  display_name: string;
  main_region: string;
  species_count: number;
};

/* ---------- Search index ---------- */

export type SearchIndexEntry = {
  kind: ResourceKind;
  id: number;
  name: string;            // canonical PokéAPI slug (for diagnostics)
  slug: string;            // locale-specific URL slug
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
