import { join } from "node:path";
import { readJson, readJsonOrNull } from "./io";

export const DATA_ROOT = join(process.cwd(), "data", "api", "v2");

export type NamedRef = { name: string; url: string };
export type LanguageRef = { language: NamedRef };

export type PokemonRaw = {
  id: number;
  name: string;
  order: number;
  height: number;
  weight: number;
  base_experience: number;
  types: Array<{ slot: number; type: NamedRef }>;
  stats: Array<{ base_stat: number; stat: NamedRef }>;
  sprites: {
    front_default: string | null;
    other?: {
      "official-artwork"?: { front_default?: string | null };
      dream_world?: { front_default?: string | null };
    };
  };
  abilities: Array<{ ability: NamedRef; is_hidden: boolean; slot: number }>;
  forms: Array<NamedRef>;
  species: NamedRef;
};

export type FlavorTextEntry = LanguageRef & {
  flavor_text: string;
  version?: NamedRef;
};

export type EffectEntry = LanguageRef & {
  effect: string;
  short_effect: string;
};

export type NameEntry = LanguageRef & { name: string };
export type GenusEntry = LanguageRef & { genus: string };

export type DescriptionEntry = LanguageRef & { description: string };

export type PokemonSpeciesRaw = {
  id: number;
  name: string;
  base_happiness: number | null;
  capture_rate: number;
  hatch_counter: number | null;
  color: NamedRef | null;
  shape: NamedRef | null;
  habitat: NamedRef | null;
  generation: NamedRef;
  growth_rate: NamedRef;
  egg_groups: NamedRef[];
  is_legendary: boolean;
  is_mythical: boolean;
  is_baby: boolean;
  names: NameEntry[];
  genera: GenusEntry[];
  flavor_text_entries: FlavorTextEntry[];
  evolution_chain: { url: string } | null;
  evolves_from_species: NamedRef | null;
  varieties: Array<{ is_default: boolean; pokemon: NamedRef }>;
};

export type AbilityRaw = {
  id: number;
  name: string;
  names: NameEntry[];
  effect_entries: EffectEntry[];
  flavor_text_entries?: Array<LanguageRef & { flavor_text: string }>;
  generation: NamedRef;
  pokemon?: Array<{ is_hidden: boolean; slot: number; pokemon: NamedRef }>;
};

export type TypeRaw = {
  id: number;
  name: string;
  names: NameEntry[];
  generation: NamedRef;
  damage_relations: {
    double_damage_from: NamedRef[];
    double_damage_to: NamedRef[];
    half_damage_from: NamedRef[];
    half_damage_to: NamedRef[];
    no_damage_from: NamedRef[];
    no_damage_to: NamedRef[];
  };
  pokemon: Array<{ slot: number; pokemon: NamedRef }>;
};

export type EvolutionDetail = {
  trigger: NamedRef | null;
  item: NamedRef | null;
  held_item: NamedRef | null;
  known_move: NamedRef | null;
  known_move_type: NamedRef | null;
  location: NamedRef | null;
  min_level: number | null;
  min_happiness: number | null;
  min_affection: number | null;
  min_beauty: number | null;
  time_of_day: string;
  gender: number | null;
  needs_overworld_rain: boolean;
  turn_upside_down: boolean;
  party_species: NamedRef | null;
  party_type: NamedRef | null;
  trade_species: NamedRef | null;
  used_move: NamedRef | null;
  relative_physical_stats: number | null;
};

export type EvolutionChainLink = {
  is_baby: boolean;
  species: NamedRef;
  evolution_details: EvolutionDetail[];
  evolves_to: EvolutionChainLink[];
};

export type EvolutionChainRaw = {
  id: number;
  baby_trigger_item: NamedRef | null;
  chain: EvolutionChainLink;
};

export type BerryRaw = {
  id: number;
  name: string;
  firmness: NamedRef;
  growth_time: number;
  max_harvest: number;
  size: number;
  smoothness: number;
  soil_dryness: number;
  natural_gift_power: number;
  natural_gift_type: NamedRef;
  item: NamedRef;
  flavors: Array<{ flavor: NamedRef; potency: number }>;
};

export type BerryFirmnessRaw = {
  id: number;
  name: string;
  names: NameEntry[];
};

export type ItemRaw = {
  id: number;
  name: string;
  cost: number;
  category: NamedRef;
  attributes: NamedRef[];
  fling_power: number | null;
  fling_effect: NamedRef | null;
  effect_entries: EffectEntry[];
  flavor_text_entries: Array<LanguageRef & { text: string; version_group?: NamedRef }>;
  names: NameEntry[];
  held_by_pokemon: Array<{ pokemon: NamedRef }>;
  sprites: { default: string | null };
};

export type ItemCategoryRaw = {
  id: number;
  name: string;
  names: NameEntry[];
  items: NamedRef[];
  pocket: NamedRef;
};

export type MoveRaw = {
  id: number;
  name: string;
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  priority: number;
  type: NamedRef;
  damage_class: NamedRef;
  generation: NamedRef;
  target: NamedRef;
  names: NameEntry[];
  effect_entries: EffectEntry[];
  flavor_text_entries: Array<
    LanguageRef & { flavor_text: string; version_group?: NamedRef }
  >;
  learned_by_pokemon: NamedRef[];
};

export type MoveDamageClassRaw = {
  id: number;
  name: string;
  names: NameEntry[];
};

export type LocationRaw = {
  id: number;
  name: string;
  region: NamedRef | null;
  names: NameEntry[];
  areas: NamedRef[];
};

export type LocationAreaRaw = {
  id: number;
  name: string;
  location: NamedRef;
  names: NameEntry[];
};

export type GenerationRaw = {
  id: number;
  name: string;
  names: NameEntry[];
  main_region: NamedRef;
  abilities: NamedRef[];
  moves: NamedRef[];
  types: NamedRef[];
  pokemon_species: NamedRef[];
  version_groups: NamedRef[];
};

export type PokemonFormRaw = {
  id: number;
  name: string;
  form_name: string;
  form_order: number;
  is_default: boolean;
  is_battle_only: boolean;
  is_mega: boolean;
  order: number;
  pokemon: NamedRef;
  names: NameEntry[];
  form_names: NameEntry[];
  types: Array<{ slot: number; type: NamedRef }>;
  version_group: NamedRef;
  sprites: {
    front_default: string | null;
    front_shiny?: string | null;
  };
};

export function refId(ref: Pick<NamedRef, "url">): number {
  const match = /\/(\d+)\/?$/.exec(ref.url);
  if (!match) throw new Error(`Cannot parse id from url ${ref.url}`);
  return Number(match[1]);
}

export function refIdSafe(ref: Pick<NamedRef, "url">): number | null {
  const match = /\/(\d+)\/?$/.exec(ref.url);
  if (!match) return null;
  return Number(match[1]);
}

export function readPokemon(id: number): PokemonRaw {
  return readJson<PokemonRaw>(join(DATA_ROOT, "pokemon", String(id), "index.json"));
}

export function readPokemonOrNull(id: number): PokemonRaw | null {
  return readJsonOrNull<PokemonRaw>(join(DATA_ROOT, "pokemon", String(id), "index.json"));
}

export function readSpecies(id: number): PokemonSpeciesRaw {
  return readJson<PokemonSpeciesRaw>(
    join(DATA_ROOT, "pokemon-species", String(id), "index.json"),
  );
}

export function readSpeciesOrNull(id: number): PokemonSpeciesRaw | null {
  return readJsonOrNull<PokemonSpeciesRaw>(
    join(DATA_ROOT, "pokemon-species", String(id), "index.json"),
  );
}

export function readAbility(id: number): AbilityRaw | null {
  return readJsonOrNull<AbilityRaw>(join(DATA_ROOT, "ability", String(id), "index.json"));
}

export function readType(id: number): TypeRaw | null {
  return readJsonOrNull<TypeRaw>(join(DATA_ROOT, "type", String(id), "index.json"));
}

export function readEvolutionChain(id: number): EvolutionChainRaw | null {
  return readJsonOrNull<EvolutionChainRaw>(
    join(DATA_ROOT, "evolution-chain", String(id), "index.json"),
  );
}

export function readBerry(id: number): BerryRaw | null {
  return readJsonOrNull<BerryRaw>(join(DATA_ROOT, "berry", String(id), "index.json"));
}

export function readBerryFirmness(id: number): BerryFirmnessRaw | null {
  return readJsonOrNull<BerryFirmnessRaw>(
    join(DATA_ROOT, "berry-firmness", String(id), "index.json"),
  );
}

export function readItem(id: number): ItemRaw | null {
  return readJsonOrNull<ItemRaw>(join(DATA_ROOT, "item", String(id), "index.json"));
}

export function readItemCategory(id: number): ItemCategoryRaw | null {
  return readJsonOrNull<ItemCategoryRaw>(
    join(DATA_ROOT, "item-category", String(id), "index.json"),
  );
}

export function readMove(id: number): MoveRaw | null {
  return readJsonOrNull<MoveRaw>(join(DATA_ROOT, "move", String(id), "index.json"));
}

export function readMoveDamageClass(id: number): MoveDamageClassRaw | null {
  return readJsonOrNull<MoveDamageClassRaw>(
    join(DATA_ROOT, "move-damage-class", String(id), "index.json"),
  );
}

export function readLocation(id: number): LocationRaw | null {
  return readJsonOrNull<LocationRaw>(join(DATA_ROOT, "location", String(id), "index.json"));
}

export function readLocationArea(id: number): LocationAreaRaw | null {
  return readJsonOrNull<LocationAreaRaw>(
    join(DATA_ROOT, "location-area", String(id), "index.json"),
  );
}

export function readGeneration(id: number): GenerationRaw | null {
  return readJsonOrNull<GenerationRaw>(
    join(DATA_ROOT, "generation", String(id), "index.json"),
  );
}

export function readPokemonForm(id: number): PokemonFormRaw | null {
  return readJsonOrNull<PokemonFormRaw>(
    join(DATA_ROOT, "pokemon-form", String(id), "index.json"),
  );
}

export type ResourceIndex = {
  count: number;
  results: NamedRef[];
};

export function readResourceIndex(resource: string): ResourceIndex {
  return readJson<ResourceIndex>(join(DATA_ROOT, resource, "index.json"));
}

export type PokemonIndex = ResourceIndex;

export function readPokemonIndex(): PokemonIndex {
  return readResourceIndex("pokemon");
}
