import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "blue" | "yellow" | "red";
export type Mode = "light" | "dark";
export type Scale = "xs" | "sm" | "md" | "lg" | "xl";
export type Dir = "ltr" | "rtl";

export type Preferences = {
  theme: Theme;
  mode: Mode;
  scale: Scale;
  dir: Dir;
};

const STORAGE_KEY = "pokedex.prefs";
const DEFAULTS: Preferences = { theme: "blue", mode: "light", scale: "md", dir: "ltr" };

const THEME_COLOR: Record<Theme, string> = {
  blue: "#1e6feb",
  yellow: "#f4c542",
  red: "#e54e4e",
};

type Ctx = {
  prefs: Preferences;
  setTheme: (t: Theme) => void;
  setMode: (m: Mode) => void;
  setScale: (s: Scale) => void;
  setDir: (d: Dir) => void;
  reset: () => void;
};

const PreferencesContext = createContext<Ctx | null>(null);

function readInitial(): Preferences {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Preferences>) };
  } catch {
    return DEFAULTS;
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(readInitial);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = prefs.theme;
    root.dataset.mode = prefs.mode;
    root.dataset.scale = prefs.scale;
    root.dir = prefs.dir;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = THEME_COLOR[prefs.theme];
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore
    }
  }, [prefs]);

  const setTheme = useCallback((theme: Theme) => setPrefs((p) => ({ ...p, theme })), []);
  const setMode = useCallback((mode: Mode) => setPrefs((p) => ({ ...p, mode })), []);
  const setScale = useCallback((scale: Scale) => setPrefs((p) => ({ ...p, scale })), []);
  const setDir = useCallback((dir: Dir) => setPrefs((p) => ({ ...p, dir })), []);
  const reset = useCallback(() => setPrefs(DEFAULTS), []);

  const value = useMemo<Ctx>(
    () => ({ prefs, setTheme, setMode, setScale, setDir, reset }),
    [prefs, setTheme, setMode, setScale, setDir, reset],
  );

  return <PreferencesContext value={value}>{children}</PreferencesContext>;
}

export function usePreferences(): Ctx {
  const ctx = use(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used inside <PreferencesProvider>");
  return ctx;
}
