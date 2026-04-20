export type DossierKey =
  | "height"
  | "weight"
  | "base-exp"
  | "catch-rate"
  | "happiness"
  | "hatch-counter"
  | "habitat"
  | "shape"
  | "color"
  | "growth"
  | "egg-groups"
  | "rarity"
  | "generation"
  | "form-name"
  | "version-group";

export type DossierEntry = {
  display: string;
  description: string;
  note?: string;
};

export const DOSSIER_INFO: Record<DossierKey, DossierEntry> = {
  height: {
    display: "Height",
    description:
      "Physical height of the Pokémon, measured in metres. Ranges from tiny (0.1 m) to enormous (14 m+).",
  },
  weight: {
    display: "Weight",
    description:
      "Mass of the Pokémon in kilograms. Affects a handful of moves (Heavy Slam, Low Kick) and some item mechanics.",
  },
  "base-exp": {
    display: "Base experience",
    description:
      "EXP yielded to the victor when this Pokémon faints. Higher means more levelling fuel; typical range is 50–300.",
  },
  "catch-rate": {
    display: "Catch rate",
    description:
      "Base probability factor (0–255) the game uses when calculating Poké Ball success. Higher = easier to catch.",
    note: "Further modified in the capture formula by HP, status effects, and ball type.",
  },
  happiness: {
    display: "Base happiness",
    description:
      "Starting friendship value when caught. Affects moves like Return and Frustration, and some friendship-based evolutions.",
  },
  "hatch-counter": {
    display: "Hatch counter",
    description:
      "How long a freshly-laid egg takes to hatch. Each cycle is roughly 256 steps in the overworld.",
  },
  habitat: {
    display: "Habitat",
    description:
      "The environment the Pokémon is commonly associated with. Used for encounter tables and older Pokédex groupings.",
  },
  shape: {
    display: "Body shape",
    description:
      "A coarse silhouette group (quadruped, winged, serpentine, humanoid, etc.). Legacy Pokédexes used this as a browse filter.",
  },
  color: {
    display: "Colour",
    description:
      "The dominant hue on the Pokémon, as catalogued by the Pokédex. Used for colour-based browse filters.",
  },
  growth: {
    display: "Growth rate",
    description:
      "The EXP curve used to determine levelling speed. Slower curves mean more EXP required per level (the 'slow' curve needs ~1.25M EXP for level 100).",
  },
  "egg-groups": {
    display: "Egg groups",
    description:
      "Breeding compatibility pools. Two Pokémon can produce an egg if they share at least one egg group (and aren't both male or in the No-Egg group).",
  },
  rarity: {
    display: "Rarity",
    description:
      "Whether this Pokémon is classified as Baby, Legendary, Mythical, or Standard. Rarity tags influence availability and capture rules.",
  },
  generation: {
    display: "Generation",
    description:
      "The game generation this Pokémon was introduced in. Gen I = Red/Blue/Yellow, Gen II = Gold/Silver/Crystal, and so on.",
  },
  "form-name": {
    display: "Form name",
    description:
      "Identifier for this specific form variant (e.g. Mega Charizard X, Alolan Raichu, Therian Forme). Blank for the default form.",
  },
  "version-group": {
    display: "Version group",
    description:
      "The game pair/trio this form's data applies to (e.g. 'ruby-sapphire', 'sword-shield'). Controls which moves and sprites apply.",
  },
};

export function dossierInfo(key: string): DossierEntry | null {
  return DOSSIER_INFO[key as DossierKey] ?? null;
}
