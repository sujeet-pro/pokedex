export function titleCase(name: string): string {
  return name
    .split(/[-_\s]/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join(" ");
}

export function padId(id: number): string {
  return `#${String(id).padStart(4, "0")}`;
}

export function decimetersToMeters(dm: number): string {
  return `${(dm / 10).toFixed(1)} m`;
}

export function hectogramsToKg(hg: number): string {
  return `${(hg / 10).toFixed(1)} kg`;
}

export function cleanFlavor(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function englishEntry<T extends { language: { name: string } }>(entries: T[]): T | undefined {
  return entries.find((e) => e.language.name === "en");
}

export const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  "special-attack": "Sp. Atk",
  "special-defense": "Sp. Def",
  speed: "Speed",
};
