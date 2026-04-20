export type TypeName =
  | "normal"
  | "fire"
  | "water"
  | "electric"
  | "grass"
  | "ice"
  | "fighting"
  | "poison"
  | "ground"
  | "flying"
  | "psychic"
  | "bug"
  | "rock"
  | "ghost"
  | "dragon"
  | "dark"
  | "steel"
  | "fairy"
  | "stellar"
  | "unknown";

export type TypeInfo = {
  name: TypeName;
  display: string;
  short: string; // 3-letter code used in HUD
  color: string; // pill / dot color
  textColor: string; // readable text on color
  description: string; // one-liner for popover
};

export const TYPE_INFO: Record<TypeName, TypeInfo> = {
  normal: {
    name: "normal",
    display: "Normal",
    short: "NOR",
    color: "#a8a878",
    textColor: "#1a1a10",
    description:
      "Plain physical moves. Unable to hit Ghost-types at all, and shrugs off nothing in particular.",
  },
  fire: {
    name: "fire",
    display: "Fire",
    short: "FIR",
    color: "#ee8130",
    textColor: "#1a0a00",
    description:
      "Burning attacks that scorch Grass, Bug, Ice, and Steel. Struggles against Water, Ground, and Rock.",
  },
  water: {
    name: "water",
    display: "Water",
    short: "WAT",
    color: "#6390f0",
    textColor: "#001030",
    description:
      "Fluid, relentless moves. Douses Fire, Ground, and Rock — fizzles against Grass and other Water types.",
  },
  electric: {
    name: "electric",
    display: "Electric",
    short: "ELE",
    color: "#f7d02c",
    textColor: "#1a1400",
    description:
      "Shocks Water and Flying hard. Can't touch Ground, and does little to Grass or Dragon.",
  },
  grass: {
    name: "grass",
    display: "Grass",
    short: "GRA",
    color: "#7ac74c",
    textColor: "#0a1a00",
    description:
      "Nature-based moves. Overwhelms Water, Ground, and Rock. Weak into Fire, Bug, Flying, and Ice.",
  },
  ice: {
    name: "ice",
    display: "Ice",
    short: "ICE",
    color: "#96d9d6",
    textColor: "#001a1a",
    description:
      "Freezes Grass, Ground, Flying, and Dragon. Brittle — weak to Fire, Fighting, Rock, and Steel.",
  },
  fighting: {
    name: "fighting",
    display: "Fighting",
    short: "FIG",
    color: "#c22e28",
    textColor: "#ffffff",
    description:
      "Close-combat strikes. Hits Normal, Ice, Rock, Dark, and Steel hard. Fails against Ghost.",
  },
  poison: {
    name: "poison",
    display: "Poison",
    short: "POI",
    color: "#a33ea1",
    textColor: "#ffffff",
    description:
      "Toxic moves that eat away at Grass and Fairy. Ineffective on Poison, Ground, Rock, Ghost, Steel.",
  },
  ground: {
    name: "ground",
    display: "Ground",
    short: "GRO",
    color: "#e2bf65",
    textColor: "#1a1000",
    description:
      "Heavy earth attacks. Devastates Fire, Electric, Poison, Rock, and Steel. Never hits Flying.",
  },
  flying: {
    name: "flying",
    display: "Flying",
    short: "FLY",
    color: "#a98ff3",
    textColor: "#10002a",
    description:
      "Aerial strikes. Beats Grass, Fighting, and Bug. Grounded by Electric, Ice, and Rock.",
  },
  psychic: {
    name: "psychic",
    display: "Psychic",
    short: "PSY",
    color: "#f95587",
    textColor: "#2a0010",
    description:
      "Mental assaults. Overpowers Fighting and Poison. Preyed on by Bug, Ghost, and Dark.",
  },
  bug: {
    name: "bug",
    display: "Bug",
    short: "BUG",
    color: "#a6b91a",
    textColor: "#0a1200",
    description:
      "Creepy-crawly attacks. Eats into Grass, Psychic, and Dark. Crushed by Fire, Flying, Rock.",
  },
  rock: {
    name: "rock",
    display: "Rock",
    short: "ROC",
    color: "#b6a136",
    textColor: "#1a1000",
    description:
      "Rugged projectiles. Smashes Fire, Ice, Flying, and Bug. Crumbles to Water, Grass, Fighting, Ground, Steel.",
  },
  ghost: {
    name: "ghost",
    display: "Ghost",
    short: "GHO",
    color: "#735797",
    textColor: "#ffffff",
    description:
      "Haunting strikes. Passes through Normal entirely. Strong against Psychic and other Ghosts.",
  },
  dragon: {
    name: "dragon",
    display: "Dragon",
    short: "DRA",
    color: "#6f35fc",
    textColor: "#ffffff",
    description:
      "Ancient power. Only super-effective on other Dragons. Neutralised completely by Fairy.",
  },
  dark: {
    name: "dark",
    display: "Dark",
    short: "DAR",
    color: "#705746",
    textColor: "#ffffff",
    description:
      "Underhanded moves. Targets Psychic and Ghost. Stumbles against Fighting, Bug, and Fairy.",
  },
  steel: {
    name: "steel",
    display: "Steel",
    short: "STE",
    color: "#b7b7ce",
    textColor: "#000814",
    description:
      "Metallic defence. Resists a dozen types. Only Fire, Fighting, and Ground break through.",
  },
  fairy: {
    name: "fairy",
    display: "Fairy",
    short: "FAI",
    color: "#d685ad",
    textColor: "#2a0010",
    description:
      "Enchantment-based moves. Counters Dragon, Fighting, and Dark. Hurt by Poison and Steel.",
  },
  stellar: {
    name: "stellar",
    display: "Stellar",
    short: "STR",
    color: "#40b5a5",
    textColor: "#00141a",
    description: "Terastal-era attacks that break through Terastallised targets.",
  },
  unknown: {
    name: "unknown",
    display: "Unknown",
    short: "UNK",
    color: "#68a090",
    textColor: "#ffffff",
    description: "No type data available for this entry.",
  },
};

export const ALL_TYPES: TypeName[] = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
];

export function typeInfo(name: string): TypeInfo {
  return TYPE_INFO[name as TypeName] ?? TYPE_INFO.unknown;
}
