export type NamedResource = {
  name: string;
  url: string;
};

export type PaginatedList<T = NamedResource> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type PokemonSprites = {
  front_default: string | null;
  front_shiny: string | null;
  back_default: string | null;
  back_shiny: string | null;
  other?: {
    "official-artwork"?: { front_default: string | null; front_shiny: string | null };
    home?: { front_default: string | null; front_shiny: string | null };
    dream_world?: { front_default: string | null };
  };
};

export type PokemonStat = {
  base_stat: number;
  effort: number;
  stat: NamedResource;
};

export type PokemonType = {
  slot: number;
  type: NamedResource;
};

export type PokemonAbilityRef = {
  ability: NamedResource;
  is_hidden: boolean;
  slot: number;
};

export type PokemonMove = {
  move: NamedResource;
};

export type Pokemon = {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  order: number;
  sprites: PokemonSprites;
  stats: PokemonStat[];
  types: PokemonType[];
  abilities: PokemonAbilityRef[];
  moves: PokemonMove[];
  species: NamedResource;
  forms: NamedResource[];
  cries?: { latest?: string; legacy?: string };
};

export type FlavorText = {
  flavor_text: string;
  language: NamedResource;
  version?: NamedResource;
};

export type Genus = { genus: string; language: NamedResource };

export type PokemonSpecies = {
  id: number;
  name: string;
  order: number;
  capture_rate: number;
  base_happiness: number;
  is_baby: boolean;
  is_legendary: boolean;
  is_mythical: boolean;
  hatch_counter: number | null;
  color: NamedResource;
  shape: NamedResource | null;
  habitat: NamedResource | null;
  generation: NamedResource;
  growth_rate: NamedResource;
  evolution_chain: { url: string } | null;
  flavor_text_entries: FlavorText[];
  genera: Genus[];
  varieties: { is_default: boolean; pokemon: NamedResource }[];
  names: { name: string; language: NamedResource }[];
  egg_groups: NamedResource[];
};

export type TypeRelations = {
  double_damage_from: NamedResource[];
  double_damage_to: NamedResource[];
  half_damage_from: NamedResource[];
  half_damage_to: NamedResource[];
  no_damage_from: NamedResource[];
  no_damage_to: NamedResource[];
};

export type TypeDetail = {
  id: number;
  name: string;
  damage_relations: TypeRelations;
  pokemon: { pokemon: NamedResource; slot: number }[];
  moves: NamedResource[];
  generation: NamedResource;
};

export type AbilityDetail = {
  id: number;
  name: string;
  is_main_series: boolean;
  generation: NamedResource;
  names: { name: string; language: NamedResource }[];
  effect_entries: { effect: string; short_effect: string; language: NamedResource }[];
  flavor_text_entries: {
    flavor_text: string;
    language: NamedResource;
    version_group?: NamedResource;
  }[];
  pokemon: { is_hidden: boolean; slot: number; pokemon: NamedResource }[];
};

export type PokemonForm = {
  id: number;
  name: string;
  form_name: string;
  pokemon: NamedResource;
  sprites: PokemonSprites;
  types: PokemonType[];
  version_group: NamedResource;
  form_names: { name: string; language: NamedResource }[];
  names: { name: string; language: NamedResource }[];
};

export type EvolutionDetailEntry = {
  min_level: number | null;
  trigger: NamedResource;
  item: NamedResource | null;
};

export type EvolutionChainLink = {
  species: NamedResource;
  evolution_details: EvolutionDetailEntry[];
  evolves_to: EvolutionChainLink[];
};

export type EvolutionChain = {
  id: number;
  chain: EvolutionChainLink;
};

// ── Newly-supported resources (read by scripts, not by UI code) ─────

export type BerryDetail = {
  id: number;
  name: string;
  firmness: NamedResource;
  flavors: { flavor: NamedResource; potency: number }[];
  growth_time: number;
  max_harvest: number;
  natural_gift_power: number;
  natural_gift_type: NamedResource;
  size: number;
  smoothness: number;
  soil_dryness: number;
  item: NamedResource;
};

export type VersionGroupedText = {
  text?: string;
  flavor_text?: string;
  language: NamedResource;
  version_group?: NamedResource;
};

export type ItemDetail = {
  id: number;
  name: string;
  category: NamedResource;
  cost: number;
  fling_power: number | null;
  fling_effect: NamedResource | null;
  attributes: NamedResource[];
  effect_entries: { effect: string; short_effect: string; language: NamedResource }[];
  flavor_text_entries: VersionGroupedText[];
  names: { name: string; language: NamedResource }[];
  held_by_pokemon: { pokemon: NamedResource }[];
  sprites: { default: string | null };
};

export type LocationDetail = {
  id: number;
  name: string;
  region: NamedResource | null;
  areas: NamedResource[];
  names: { name: string; language: NamedResource }[];
  game_indices: { game_index: number; generation: NamedResource }[];
};

export type MoveDetail = {
  id: number;
  name: string;
  type: NamedResource;
  damage_class: NamedResource;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  priority: number;
  target: NamedResource;
  generation: NamedResource;
  effect_chance: number | null;
  effect_entries: { effect: string; short_effect: string; language: NamedResource }[];
  flavor_text_entries: VersionGroupedText[];
  names: { name: string; language: NamedResource }[];
  learned_by_pokemon: NamedResource[];
};

export type GenerationDetail = {
  id: number;
  name: string;
  main_region: NamedResource;
  version_groups: NamedResource[];
  pokemon_species: NamedResource[];
  moves: NamedResource[];
  types: NamedResource[];
  abilities: NamedResource[];
  names: { name: string; language: NamedResource }[];
};
