import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SearchDialogContextValue = {
  open: boolean;
  setOpen: (next: boolean) => void;
  toggle: () => void;
};

const SearchDialogContext = createContext<SearchDialogContextValue | null>(null);

type ProviderProps = { children: ReactNode };

export function SearchDialogProvider({ children }: ProviderProps) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const value = useMemo<SearchDialogContextValue>(
    () => ({ open, setOpen, toggle }),
    [open, toggle]
  );
  return (
    <SearchDialogContext.Provider value={value}>
      {children}
    </SearchDialogContext.Provider>
  );
}

export function useSearchDialog(): SearchDialogContextValue {
  const ctx = useContext(SearchDialogContext);
  if (!ctx) {
    // Safe fallback so a component can render outside the provider (e.g. in
    // tests or SSR-only trees) without crashing.
    return { open: false, setOpen: () => {}, toggle: () => {} };
  }
  return ctx;
}
