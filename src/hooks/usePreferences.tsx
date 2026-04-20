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
  /** Name of a SpeechSynthesisVoice; `null` = auto-pick a sensible default. */
  voice: string | null;
};

const STORAGE_KEY = "pokedex.prefs";
const DEFAULTS: Preferences = {
  theme: "red",
  mode: "dark",
  scale: "md",
  dir: "ltr",
  voice: null,
};

const THEME_COLOR: Record<Theme, string> = {
  blue: "#264ba0",
  yellow: "#d4a61f",
  red: "#bb2a2a",
};

type Ctx = {
  prefs: Preferences;
  setTheme: (t: Theme) => void;
  setMode: (m: Mode) => void;
  setScale: (s: Scale) => void;
  setDir: (d: Dir) => void;
  setVoice: (v: string | null) => void;
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
  const setVoice = useCallback((voice: string | null) => setPrefs((p) => ({ ...p, voice })), []);
  const reset = useCallback(() => setPrefs(DEFAULTS), []);

  const value = useMemo<Ctx>(
    () => ({ prefs, setTheme, setMode, setScale, setDir, setVoice, reset }),
    [prefs, setTheme, setMode, setScale, setDir, setVoice, reset],
  );

  return <PreferencesContext value={value}>{children}</PreferencesContext>;
}

export function usePreferences(): Ctx {
  const ctx = use(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used inside <PreferencesProvider>");
  return ctx;
}
