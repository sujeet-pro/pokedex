// Shapes emitted by scripts/build-bundles.ts. One file per detail page, one fetch.
// When a page needs a new field, extend the shape here AND update the matching
// transform in scripts/lib/transform/*.

export type BundleRef = { name: string };

export type BundleEvoNode = {
  name: string;
  id: number;
  /** Precomputed trigger label, e.g. "LVL 16" or "Thunder Stone". Empty on root. */
  trigger: string;
  evolves_to: BundleEvoNode[];
};

export type BundleDefenderType = {
  name: string;
  no_damage_from: string[];
  double_damage_from: string[];
  half_damage_from: string[];
};

export type BundlePagerNeighbour = { name: string; id: number };

export type PokemonBundle = {
  kind: "pokemon";
  id: number;
  name: string;
  order: number;
  height: number;
  weight: number;
  base_experience: number;
  types: { slot: number; name: string }[];
  stats: { name: string; base_stat: number }[];
  sprites: {
    front_default: string | null;
    official_artwork: string | null;
  };
  abilities: { name: string; is_hidden: boolean; slot: number }[];
  forms: { name: string }[];
  species: {
    name: string;
    /** e.g. "generation-i" */
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
    /** Cleaned English flavor text (newlines / form-feeds stripped). */
    flavor: string;
    /** English genus, e.g. "Seed Pokémon". */
    genus: string | null;
  };
  evolution_chain: BundleEvoNode | null;
  defenders: BundleDefenderType[];
  pager: {
    prev: BundlePagerNeighbour | null;
    next: BundlePagerNeighbour | null;
  };
  /** True if an AI-generated human-readable summary exists at bundles/summary/<id>_en.txt. */
  has_summary: boolean;
};

export type PokemonIndexEntry = {
  name: string;
  id: number;
  types: string[];
  /** Generation name ("generation-i"..."generation-ix") — empty for entries whose species lookup failed. */
  generation: string;
};

export type PokemonIndexBundle = {
  kind: "pokemon-index";
  total: number;
  entries: PokemonIndexEntry[];
};

export type TypeBundle = {
  kind: "type";
  id: number;
  name: string;
  generation: string;
  relations: {
    double_damage_to: string[];
    half_damage_to: string[];
    no_damage_to: string[];
    double_damage_from: string[];
    half_damage_from: string[];
    no_damage_from: string[];
  };
  pokemon: { name: string; id: number; slot: number }[];
};

export type AbilityBundle = {
  kind: "ability";
  id: number;
  name: string;
  display_name: string;
  generation: string;
  short_effect: string | null;
  effect: string | null;
  flavor: string | null;
  pokemon: { name: string; id: number; is_hidden: boolean }[];
};

export type SpeciesBundle = {
  kind: "species";
  id: number;
  name: string;
  display_name: string;
  genus: string | null;
  flavor: string;
  generation: string;
  color: string;
  shape: string | null;
  habitat: string | null;
  capture_rate: number;
  base_happiness: number;
  is_legendary: boolean;
  is_mythical: boolean;
  is_baby: boolean;
  varieties: { name: string; is_default: boolean }[];
};

export type FormBundle = {
  kind: "form";
  id: number;
  name: string;
  form_name: string;
  display_name: string;
  pokemon: { name: string };
  types: { slot: number; name: string }[];
  sprites: { front_default: string | null };
  version_group: string;
};

export type BerryBundle = {
  kind: "berry";
  id: number;
  name: string;
  display_name: string;
  firmness: string;
  growth_time: number;
  max_harvest: number;
  natural_gift_power: number;
  natural_gift_type: string;
  size: number;
  smoothness: number;
  soil_dryness: number;
  flavors: { name: string; potency: number }[];
  item: { name: string };
};

export type ItemBundle = {
  kind: "item";
  id: number;
  name: string;
  display_name: string;
  category: string;
  cost: number;
  fling_power: number | null;
  fling_effect: string | null;
  attributes: string[];
  short_effect: string | null;
  effect: string | null;
  flavor: string | null;
  sprite: string | null;
  held_by_pokemon: { name: string }[];
};

export type LocationBundle = {
  kind: "location";
  id: number;
  name: string;
  display_name: string;
  region: string | null;
  generation: string | null;
  areas: { name: string }[];
};

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
  short_effect: string | null;
  effect: string | null;
  effect_chance: number | null;
  flavor: string | null;
  /** Full list — most moves have tens of learners, the outlier is hundreds. Fine to keep. */
  learned_by_pokemon: { name: string; id: number }[];
};

export type GenerationBundle = {
  kind: "generation";
  id: number;
  name: string;
  display_name: string;
  main_region: string;
  version_groups: { name: string }[];
  pokemon_species_count: number;
  moves_count: number;
  types: { name: string }[];
  abilities: { name: string }[];
};

// ── List indexes ────────────────────────────────────────────────────

type IndexBase = {
  name: string;
  id: number;
  display_name: string;
};

export type BerryIndexBundle = {
  kind: "berry-index";
  total: number;
  entries: (IndexBase & { firmness: string; natural_gift_type: string })[];
};

export type ItemIndexBundle = {
  kind: "item-index";
  total: number;
  entries: (IndexBase & { category: string; cost: number; sprite: string | null })[];
};

export type LocationIndexBundle = {
  kind: "location-index";
  total: number;
  entries: (IndexBase & { region: string | null })[];
};

export type MoveIndexBundle = {
  kind: "move-index";
  total: number;
  entries: (IndexBase & {
    type: string;
    damage_class: string;
    power: number | null;
    accuracy: number | null;
  })[];
};

export type GenerationIndexBundle = {
  kind: "generation-index";
  total: number;
  entries: (IndexBase & { main_region: string })[];
};

export type TypeIndexBundle = {
  kind: "type-index";
  total: number;
  entries: (IndexBase & { generation: string })[];
};

export type AbilityIndexBundle = {
  kind: "ability-index";
  total: number;
  entries: (IndexBase & { generation: string })[];
};

// ── Unified search index ────────────────────────────────────────────

export type SearchKind =
  | "pokemon"
  | "type"
  | "ability"
  | "species"
  | "form"
  | "berry"
  | "item"
  | "location"
  | "move"
  | "generation";

export type SearchEntry = {
  kind: SearchKind;
  name: string;
  id: number;
  display_name: string;
  /** Optional tag for quick filtering (e.g. pokemon types, item category, move type). */
  tag?: string;
};

export type SearchIndexBundle = {
  kind: "search-index";
  total: number;
  entries: SearchEntry[];
};
