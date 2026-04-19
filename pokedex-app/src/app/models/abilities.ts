export interface IAbilities {
  effect_changes: any[];
  effect_entries: EffectEntry[];
  flavor_text_entries: FlavorTextEntry[];
  generation: NameAndUrl;
  id: number;
  is_main_series: boolean;
  name: string;
  names: Name[];
  pokemon: Pokemon[];
}

export interface EffectEntry {
  effect: string;
  language: NameAndUrl;
  short_effect: string;
}

export interface NameAndUrl {
  name: string;
  url: string;
}

export interface FlavorTextEntry {
  flavor_text: string;
  language: NameAndUrl;
  version_group: NameAndUrl;
}

export interface Name {
  language: NameAndUrl;
  name: string;
}

export interface Pokemon {
  is_hidden: boolean;
  pokemon: NameAndUrl;
  slot: number;
}
