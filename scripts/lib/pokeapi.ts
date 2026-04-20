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
};

export type AbilityRaw = {
  id: number;
  name: string;
  names: NameEntry[];
  effect_entries: EffectEntry[];
  flavor_text_entries?: Array<LanguageRef & { flavor_text: string }>;
  generation: NamedRef;
};

export type TypeRaw = {
  id: number;
  name: string;
  names: NameEntry[];
  damage_relations: {
    double_damage_from: NamedRef[];
    double_damage_to: NamedRef[];
    half_damage_from: NamedRef[];
    half_damage_to: NamedRef[];
    no_damage_from: NamedRef[];
    no_damage_to: NamedRef[];
  };
};

export function refId(ref: Pick<NamedRef, "url">): number {
  const match = /\/(\d+)\/?$/.exec(ref.url);
  if (!match) throw new Error(`Cannot parse id from url ${ref.url}`);
  return Number(match[1]);
}

export function readPokemon(id: number): PokemonRaw {
  return readJson<PokemonRaw>(join(DATA_ROOT, "pokemon", String(id), "index.json"));
}

export function readSpecies(id: number): PokemonSpeciesRaw {
  return readJson<PokemonSpeciesRaw>(
    join(DATA_ROOT, "pokemon-species", String(id), "index.json"),
  );
}

export function readAbility(id: number): AbilityRaw | null {
  return readJsonOrNull<AbilityRaw>(join(DATA_ROOT, "ability", String(id), "index.json"));
}

export function readType(id: number): TypeRaw | null {
  return readJsonOrNull<TypeRaw>(join(DATA_ROOT, "type", String(id), "index.json"));
}

export type PokemonIndex = {
  count: number;
  results: NamedRef[];
};

export function readPokemonIndex(): PokemonIndex {
  return readJson<PokemonIndex>(join(DATA_ROOT, "pokemon", "index.json"));
}
