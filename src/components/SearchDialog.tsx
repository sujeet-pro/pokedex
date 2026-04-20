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

const KIND_LABELS_FR: Record<ResourceKind, string> = {
  pokemon: "Pokémon",
  "pokemon-species": "Espèces",
  "pokemon-form": "Formes",
  type: "Types",
  ability: "Talents",
  berry: "Baies",
  item: "Objets",
  move: "Capacités",
  location: "Lieux",
  generation: "Générations",
};

function kindLabel(kind: ResourceKind, locale: Locale): string {
  return locale === "fr" ? KIND_LABELS_FR[kind] : KIND_LABELS_EN[kind];
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

function Spinner() {
  return (
    <div className="search-dialog__loading" role="status" aria-live="polite">
      <div className="skeleton" style={{ height: "1.25rem", width: "60%" }} />
      <div className="skeleton" style={{ height: "1.25rem", width: "80%", marginTop: ".5rem" }} />
      <div className="skeleton" style={{ height: "1.25rem", width: "45%", marginTop: ".5rem" }} />
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

  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (flat.length === 0) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((i) => (i + 1) % flat.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((i) => (i - 1 + flat.length) % flat.length);
      } else if (event.key === "Enter") {
        const entry = flat[activeIndex];
        if (entry) {
          event.preventDefault();
          goTo(entry);
        }
      }
    },
    [activeIndex, flat, goTo]
  );

  // Close on route change.
  useEffect(() => {
    const unsub = router.subscribe("onResolved", () => onOpenChange(false));
    return unsub;
  }, [router, onOpenChange]);

  const isEmpty = flat.length === 0;
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
          <kbd>↓</kbd> {locale === "fr" ? "naviguer" : "navigate"}
        </span>
        <span>
          <kbd>↵</kbd> {locale === "fr" ? "ouvrir" : "open"}
        </span>
        <span>
          <kbd>esc</kbd> {locale === "fr" ? "fermer" : "close"}
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
          <Suspense fallback={<Spinner />}>
            <SearchDialogBody locale={locale} onOpenChange={onOpenChange} />
          </Suspense>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
