import {
  Suspense,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Dialog, VisuallyHidden } from "radix-ui";
import { useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { searchIndexQuery } from "~/lib/queries";
import { makeT } from "~/i18n";
import type { Locale } from "~/types/locales";
import type { ResourceKind, SearchIndexEntry } from "~/types/bundles";

type Props = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  locale: Locale;
};

type EntryWithSlug = SearchIndexEntry & { slug?: string };

const RESULT_LIMIT = 48;
const TOP_HITS_LIMIT = 24;

const KIND_ORDER: ResourceKind[] = [
  "pokemon",
  "pokemon-species",
  "pokemon-form",
  "type",
  "ability",
  "berry",
  "item",
  "move",
  "location",
  "generation",
];

const KIND_LABELS_EN: Record<ResourceKind, string> = {
  pokemon: "Pokémon",
  "pokemon-species": "Species",
  "pokemon-form": "Forms",
  type: "Types",
  ability: "Abilities",
  berry: "Berries",
  item: "Items",
  move: "Moves",
  location: "Locations",
  generation: "Generations",
};

const KIND_LABELS_ES: Record<ResourceKind, string> = {
  pokemon: "Pokémon",
  "pokemon-species": "Especies",
  "pokemon-form": "Formas",
  type: "Tipos",
  ability: "Habilidades",
  berry: "Bayas",
  item: "Objetos",
  move: "Movimientos",
  location: "Lugares",
  generation: "Generaciones",
};

function kindLabel(kind: ResourceKind, locale: Locale): string {
  return locale === "es" ? KIND_LABELS_ES[kind] : KIND_LABELS_EN[kind];
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function urlFor(entry: EntryWithSlug, locale: Locale): string {
  const slug = entry.slug ?? entry.name;
  switch (entry.kind) {
    case "pokemon":
      return `/${locale}/pokemon/${slug}`;
    case "pokemon-species":
      return `/${locale}/pokemon-species/${slug}`;
    case "pokemon-form":
      return `/${locale}/pokemon-form/${slug}`;
    case "type":
      return `/${locale}/type/${slug}`;
    case "ability":
      return `/${locale}/ability/${slug}`;
    case "berry":
      return `/${locale}/berry/${slug}`;
    case "item":
      return `/${locale}/item/${slug}`;
    case "move":
      return `/${locale}/move/${slug}`;
    case "generation":
      return `/${locale}/generation/${slug}`;
    case "location":
      return `/${locale}/locations`;
  }
}

function SearchDialogSkeleton({ locale }: { locale: Locale }) {
  const t = makeT(locale);
  const rowWidths = ["72%", "58%", "80%", "46%", "64%", "52%", "74%", "60%"];
  return (
    <div className="search-dialog__body" aria-busy="true" aria-live="polite">
      <div className="search search-dialog__field">
        <div className="search-dialog__input-skeleton" aria-hidden />
      </div>
      <div className="search-dialog__results" role="presentation">
        <ul className="search__menu search-dialog__menu" aria-hidden>
          <li className="search-dialog__group-header search-dialog__group-header--skeleton">
            <span className="skeleton" style={{ display: "inline-block", height: "0.7rem", width: "5rem" }} />
          </li>
          {rowWidths.map((w, i) => (
            <li key={i} className="search-dialog__option search-dialog__option--skeleton">
              <span className="skeleton search-dialog__option-kind-skeleton" />
              <span className="skeleton search-dialog__option-name-skeleton" style={{ width: w }} />
            </li>
          ))}
        </ul>
      </div>
      <div className="search-dialog__footer" aria-hidden>
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd> {locale === "es" ? "navegar" : "navigate"}
        </span>
        <span>
          <kbd>↵</kbd> {locale === "es" ? "abrir" : "open"}
        </span>
        <span>
          <kbd>esc</kbd> {locale === "es" ? "cerrar" : "close"}
        </span>
      </div>
      <span className="visually-hidden" role="status">
        {t("search_placeholder")}
      </span>
    </div>
  );
}

type BodyProps = {
  locale: Locale;
  onOpenChange: (next: boolean) => void;
};

function SearchDialogBody({ locale, onOpenChange }: BodyProps) {
  const t = makeT(locale);
  const router = useRouter();
  const { data } = useSuspenseQuery(searchIndexQuery(locale));
  const entries = data.entries as EntryWithSlug[];

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const optionsRef = useRef<Map<number, HTMLLIElement>>(new Map());
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    // Radix autoFocus is sometimes intercepted; ensure focus after mount.
    inputRef.current?.focus();
  }, []);

  const results = useMemo<EntryWithSlug[]>(() => {
    const needle = normalize(deferredQuery.trim());
    if (!needle) {
      return entries.slice(0, TOP_HITS_LIMIT);
    }
    const matches: EntryWithSlug[] = [];
    for (const entry of entries) {
      if (matches.length >= RESULT_LIMIT) break;
      const hayName = normalize(entry.name);
      const hayDisplay = normalize(entry.display_name);
      if (hayName.includes(needle) || hayDisplay.includes(needle)) {
        matches.push(entry);
      }
    }
    return matches;
  }, [entries, deferredQuery]);

  const grouped = useMemo<{ kind: ResourceKind; items: EntryWithSlug[] }[]>(() => {
    const byKind = new Map<ResourceKind, EntryWithSlug[]>();
    for (const entry of results) {
      const bucket = byKind.get(entry.kind) ?? [];
      bucket.push(entry);
      byKind.set(entry.kind, bucket);
    }
    const ordered: { kind: ResourceKind; items: EntryWithSlug[] }[] = [];
    for (const kind of KIND_ORDER) {
      const items = byKind.get(kind);
      if (items && items.length > 0) ordered.push({ kind, items });
    }
    return ordered;
  }, [results]);

  // Build a flat list preserving the grouped render order to make keyboard
  // navigation trivial.
  const flat = useMemo<EntryWithSlug[]>(() => {
    const list: EntryWithSlug[] = [];
    for (const group of grouped) {
      for (const item of group.items) list.push(item);
    }
    return list;
  }, [grouped]);

  // Reset active index when the result set changes.
  useEffect(() => {
    setActiveIndex(0);
  }, [deferredQuery, flat.length]);

  // Ensure the active option is visible in the scroll container.
  useEffect(() => {
    const el = optionsRef.current.get(activeIndex);
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const goTo = useCallback(
    (entry: EntryWithSlug) => {
      const target = urlFor(entry, locale);
      onOpenChange(false);
      try {
        router.navigate({ to: target as never, replace: false });
      } catch {
        if (typeof window !== "undefined") {
          const base = import.meta.env.BASE_URL.endsWith("/")
            ? import.meta.env.BASE_URL.slice(0, -1)
            : import.meta.env.BASE_URL;
          window.location.href = `${base}${target}`;
        }
      }
    },
    [router, locale, onOpenChange]
  );

  const trimmedQuery = deferredQuery.trim();
  const showSearchAll = trimmedQuery.length > 0;

  const goToSearchPage = useCallback(() => {
    onOpenChange(false);
    router.navigate({
      to: "/$lang/search",
      params: { lang: locale },
      search: { q: trimmedQuery },
    });
  }, [router, locale, onOpenChange, trimmedQuery]);

  // Total navigable rows = 1 (search-all) + flat results (when query is set)
  const totalRows = (showSearchAll ? 1 : 0) + flat.length;

  // Clamp active index if the row count shrinks (e.g. query cleared).
  useEffect(() => {
    if (totalRows === 0) return;
    if (activeIndex >= totalRows) setActiveIndex(0);
  }, [activeIndex, totalRows]);

  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (totalRows === 0) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((i) => (i + 1) % totalRows);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((i) => (i - 1 + totalRows) % totalRows);
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (showSearchAll && activeIndex === 0) {
          goToSearchPage();
          return;
        }
        const resultIndex = showSearchAll ? activeIndex - 1 : activeIndex;
        const entry = flat[resultIndex];
        if (entry) goTo(entry);
      }
    },
    [activeIndex, flat, goTo, showSearchAll, goToSearchPage, totalRows]
  );

  // Close on route change.
  useEffect(() => {
    const unsub = router.subscribe("onResolved", () => onOpenChange(false));
    return unsub;
  }, [router, onOpenChange]);

  const isEmpty = totalRows === 0;
  const listboxId = "search-dialog-listbox";
  const activeOptionId = isEmpty ? undefined : `search-dialog-option-${activeIndex}`;

  return (
    <div className="search-dialog__body">
      <div className="search search-dialog__field">
        <input
          ref={inputRef}
          type="search"
          className="search__input"
          placeholder={t("search_placeholder")}
          aria-label={t("search_placeholder")}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          role="combobox"
          aria-expanded
          aria-autocomplete="list"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          onKeyDown={handleInputKeyDown}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className="search-dialog__results" role="presentation">
        {isEmpty ? (
          <div className="search-dialog__empty" role="status">
            {t("search_empty")}
          </div>
        ) : (
          <ul
            id={listboxId}
            className="search__menu search-dialog__menu"
            role="listbox"
            aria-label={t("search_placeholder")}
          >
            {(() => {
              let idx = 0;
              const rendered: React.ReactNode[] = [];

              if (showSearchAll) {
                const i = idx;
                const isActive = i === activeIndex;
                rendered.push(
                  <li
                    key="search-all"
                    ref={(node) => {
                      if (node) optionsRef.current.set(i, node);
                      else optionsRef.current.delete(i);
                    }}
                    id={`search-dialog-option-${i}`}
                    role="option"
                    aria-selected={isActive}
                    className={`search__option search-dialog__option search-dialog__option--all${
                      isActive ? " search__option--active" : ""
                    }`}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={goToSearchPage}
                  >
                    <span className="search-dialog__option-kind pill" aria-hidden>
                      ⏎
                    </span>
                    <span className="search-dialog__option-name">
                      {t("search_all_cta")} <em>“{trimmedQuery}”</em>
                    </span>
                  </li>
                );
                idx += 1;
              }

              for (const group of grouped) {
                rendered.push(
                  <li
                    key={`group-${group.kind}`}
                    className="search-dialog__group-header"
                    role="presentation"
                  >
                    {kindLabel(group.kind, locale)}
                  </li>
                );
                for (const entry of group.items) {
                  const i = idx;
                  const isActive = i === activeIndex;
                  rendered.push(
                    <li
                      key={`${entry.kind}:${entry.name}`}
                      ref={(node) => {
                        if (node) optionsRef.current.set(i, node);
                        else optionsRef.current.delete(i);
                      }}
                      id={`search-dialog-option-${i}`}
                      role="option"
                      aria-selected={isActive}
                      className={`search__option search-dialog__option${
                        isActive ? " search__option--active" : ""
                      }`}
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => goTo(entry)}
                    >
                      <span className="search-dialog__option-kind pill">
                        {kindLabel(entry.kind, locale)}
                      </span>
                      <span className="search-dialog__option-name">
                        {entry.display_name}
                      </span>
                      {entry.tag ? (
                        <span className="search-dialog__option-tag">{entry.tag}</span>
                      ) : null}
                    </li>
                  );
                  idx += 1;
                }
              }
              return rendered;
            })()}
          </ul>
        )}
      </div>

      <div className="search-dialog__footer" aria-hidden>
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd> {locale === "es" ? "navegar" : "navigate"}
        </span>
        <span>
          <kbd>↵</kbd> {locale === "es" ? "abrir" : "open"}
        </span>
        <span>
          <kbd>esc</kbd> {locale === "es" ? "cerrar" : "close"}
        </span>
      </div>
    </div>
  );
}

export function SearchDialog({ open, onOpenChange, locale }: Props) {
  const t = makeT(locale);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="search-dialog__overlay" />
        <Dialog.Content
          className="search-dialog"
          aria-label={t("search_placeholder")}
          onOpenAutoFocus={(event) => {
            // Let our body effect focus the input so we don't scroll the page.
            event.preventDefault();
          }}
        >
          <VisuallyHidden.Root>
            <Dialog.Title>{t("search_placeholder")}</Dialog.Title>
            <Dialog.Description>{t("search_open_hint")}</Dialog.Description>
          </VisuallyHidden.Root>
          <Suspense fallback={<SearchDialogSkeleton locale={locale} />}>
            <SearchDialogBody locale={locale} onOpenChange={onOpenChange} />
          </Suspense>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
