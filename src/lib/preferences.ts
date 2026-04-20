export type Theme = "red" | "blue" | "yellow";
export type Mode = "light" | "dark";
export type Scale = "xs" | "sm" | "md" | "lg" | "xl";
export type Direction = "ltr" | "rtl";
export type Preferences = {
  theme: Theme;
  mode: Mode;
  scale: Scale;
  dir: Direction;
  voice: string | null;
};

const STORAGE_KEY = "pokedex.prefs";

export function defaultPreferences(): Preferences {
  return { theme: "red", mode: "dark", scale: "md", dir: "ltr", voice: null };
}

const THEMES: readonly Theme[] = ["red", "blue", "yellow"];
const MODES: readonly Mode[] = ["light", "dark"];
const SCALES: readonly Scale[] = ["xs", "sm", "md", "lg", "xl"];
const DIRS: readonly Direction[] = ["ltr", "rtl"];

function sanitize(raw: unknown): Preferences {
  const defaults = defaultPreferences();
  if (!raw || typeof raw !== "object") return defaults;
  const p = raw as Record<string, unknown>;
  const theme = typeof p.theme === "string" && (THEMES as readonly string[]).includes(p.theme) ? (p.theme as Theme) : defaults.theme;
  const mode = typeof p.mode === "string" && (MODES as readonly string[]).includes(p.mode) ? (p.mode as Mode) : defaults.mode;
  const scale = typeof p.scale === "string" && (SCALES as readonly string[]).includes(p.scale) ? (p.scale as Scale) : defaults.scale;
  const dir = typeof p.dir === "string" && (DIRS as readonly string[]).includes(p.dir) ? (p.dir as Direction) : defaults.dir;
  const voice = typeof p.voice === "string" || p.voice === null ? (p.voice as string | null) : defaults.voice;
  return { theme, mode, scale, dir, voice };
}

export function readPreferences(): Preferences {
  if (typeof window === "undefined") return defaultPreferences();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPreferences();
    return sanitize(JSON.parse(raw));
  } catch {
    return defaultPreferences();
  }
}

export function writePreferences(p: Preferences): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // ignore quota / disabled storage
  }
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    root.dataset.theme = p.theme;
    root.dataset.mode = p.mode;
    root.dataset.scale = p.scale;
    root.dir = p.dir;
  }
}
