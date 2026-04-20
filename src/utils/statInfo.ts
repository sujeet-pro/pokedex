export type StatKey = "hp" | "attack" | "defense" | "special-attack" | "special-defense" | "speed";

export type StatInfo = {
  display: string;
  short: string;
  description: string;
  note?: string;
};

export const STAT_INFO: Record<StatKey, StatInfo> = {
  hp: {
    display: "HP",
    short: "HP",
    description:
      "The Pokémon's health pool. When HP reaches zero the Pokémon faints. Higher HP absorbs more damage before collapsing.",
    note: "Base HP ranges from 1 (Shedinja) to 255 (Blissey).",
  },
  attack: {
    display: "Attack",
    short: "ATK",
    description:
      "Power applied to physical moves — like Tackle, Slash, Close Combat, or Earthquake. Higher Attack means harder-hitting physical blows.",
  },
  defense: {
    display: "Defense",
    short: "DEF",
    description:
      "Resistance to incoming physical moves. A high-Defense Pokémon shrugs off Rock Slides, Body Slams, and similar physical attacks.",
  },
  "special-attack": {
    display: "Special Attack",
    short: "S.ATK",
    description:
      "Power applied to special moves — like Flamethrower, Thunderbolt, Psychic, or Surf. Higher Sp. Atk means stronger elemental or ranged damage.",
  },
  "special-defense": {
    display: "Special Defense",
    short: "S.DEF",
    description:
      "Resistance to incoming special moves. A high-Sp. Def Pokémon withstands energy beams, flame blasts, and psychic attacks.",
  },
  speed: {
    display: "Speed",
    short: "SPE",
    description:
      "Determines turn order in combat. The faster Pokémon moves first each turn, barring priority moves or trick-room effects.",
  },
};

export function statInfo(name: string): StatInfo | null {
  return STAT_INFO[name as StatKey] ?? null;
}
