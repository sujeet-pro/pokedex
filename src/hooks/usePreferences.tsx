import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  defaultPreferences,
  readPreferences,
  writePreferences,
  type Preferences,
} from "~/lib/preferences";

type Ctx = {
  prefs: Preferences;
  setPref: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
};

const PreferencesContext = createContext<Ctx | null>(null);

type ProviderProps = { children: ReactNode };

export function PreferencesProvider({ children }: ProviderProps) {
  // SSR + first client render both use defaults so hydration is stable.
  // A useEffect below hydrates from localStorage once mounted.
  const [prefs, setPrefs] = useState<Preferences>(() => defaultPreferences());

  useEffect(() => {
    if (import.meta.env.SSR) return;
    const stored = readPreferences();
    setPrefs(stored);
    // Also re-apply to <html> in case BOOT_PREFS_SCRIPT did not (e.g. dev).
    writePreferences(stored);
  }, []);

  const setPref = useCallback(<K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      writePreferences(next);
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(() => ({ prefs, setPref }), [prefs, setPref]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): Ctx {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    // Fallback: components used outside the provider get a no-op setter and
    // defaults. This keeps SSR-only trees and tests functional.
    return { prefs: defaultPreferences(), setPref: () => {} };
  }
  return ctx;
}
