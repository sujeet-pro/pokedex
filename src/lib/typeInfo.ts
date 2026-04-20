export type TypeSlug =
  | "normal" | "fire" | "water" | "electric" | "grass" | "ice"
  | "fighting" | "poison" | "ground" | "flying" | "psychic" | "bug"
  | "rock" | "ghost" | "dragon" | "dark" | "steel" | "fairy"
  | "stellar" | "unknown";

export type TypeInfo = { color: string; textColor: string; short: string };

export const TYPE_INFO: Record<TypeSlug, TypeInfo> = {
  normal:   { color: "#A8A77A", textColor: "#fff", short: "NOR" },
  fire:     { color: "#EE8130", textColor: "#fff", short: "FIR" },
  water:    { color: "#6390F0", textColor: "#fff", short: "WAT" },
  electric: { color: "#D4A20F", textColor: "#fff", short: "ELE" },
  grass:    { color: "#5AA636", textColor: "#fff", short: "GRA" },
  ice:      { color: "#6FBFC0", textColor: "#0b1024", short: "ICE" },
  fighting: { color: "#C22E28", textColor: "#fff", short: "FIG" },
  poison:   { color: "#A33EA1", textColor: "#fff", short: "POI" },
  ground:   { color: "#B9964D", textColor: "#fff", short: "GRO" },
  flying:   { color: "#8E7AE0", textColor: "#fff", short: "FLY" },
  psychic:  { color: "#F95587", textColor: "#fff", short: "PSY" },
  bug:      { color: "#8FA11A", textColor: "#fff", short: "BUG" },
  rock:     { color: "#907A2E", textColor: "#fff", short: "ROC" },
  ghost:    { color: "#735797", textColor: "#fff", short: "GHO" },
  dragon:   { color: "#6F35FC", textColor: "#fff", short: "DRA" },
  dark:     { color: "#5A473D", textColor: "#fff", short: "DAR" },
  steel:    { color: "#8E8E9E", textColor: "#fff", short: "STE" },
  fairy:    { color: "#C67295", textColor: "#fff", short: "FAI" },
  stellar:  { color: "#40C0B0", textColor: "#fff", short: "STL" },
  unknown:  { color: "#7F7F7F", textColor: "#fff", short: "???" },
};

export function typeInfo(slug: string): TypeInfo {
  return (TYPE_INFO as Record<string, TypeInfo>)[slug] ?? TYPE_INFO.unknown;
}
