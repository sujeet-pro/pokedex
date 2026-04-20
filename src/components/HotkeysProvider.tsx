import type { ReactNode } from "react";
import { useCallback } from "react";
import {
  HotkeysProvider as TanstackHotkeysProvider,
  useHotkeys,
  useHotkeySequences,
} from "@tanstack/react-hotkeys";
import { useRouter } from "@tanstack/react-router";
import { LOCALES, DEFAULT_LOCALE, type Locale } from "~/types/locales";

type Props = { children: ReactNode };

function detectLocale(pathname: string, base: string): Locale {
  const normBase = base.endsWith("/") ? base : `${base}/`;
  let rest = pathname;
  if (pathname.startsWith(normBase)) {
    rest = `/${pathname.slice(normBase.length)}`;
  }
  const first = rest.split("/").filter(Boolean)[0];
  if (first && (LOCALES as readonly string[]).includes(first)) return first as Locale;
  return DEFAULT_LOCALE;
}

/** Focus the canonical global search input, if present on the page. */
function focusSearch(event: Event) {
  if (typeof document === "undefined") return;
  const el = document.querySelector<HTMLElement>("[data-search-input]");
  if (el) {
    event.preventDefault();
    el.focus();
    if (el instanceof HTMLInputElement) el.select();
  }
}

/** Click the anchor matching `rel=prev|next` on the current page if any. */
function clickRel(rel: "prev" | "next") {
  if (typeof document === "undefined") return;
  const a = document.querySelector<HTMLAnchorElement>(`a[rel="${rel}"]`);
  if (a) a.click();
}

function HotkeyBindings({ children }: { children: ReactNode }) {
  const router = useRouter();
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL.slice(0, -1)
    : import.meta.env.BASE_URL;

  const go = useCallback(
    (suffix: string) => {
      const pathname =
        typeof window !== "undefined" ? window.location.pathname : `${base}/`;
      const lang = detectLocale(pathname, base);
      const path = suffix === "" ? `/${lang}` : `/${lang}/${suffix}`;
      router.navigate({ to: path as never, replace: false });
    },
    [router, base]
  );

  useHotkeys(
    [
      {
        hotkey: "/",
        callback: (e) => focusSearch(e),
        options: { ignoreInputs: true, preventDefault: false },
      },
      {
        hotkey: "Mod+K",
        callback: (e) => focusSearch(e),
        options: { ignoreInputs: false, preventDefault: true },
      },
      {
        hotkey: "[",
        callback: () => clickRel("prev"),
        options: { ignoreInputs: true },
      },
      {
        hotkey: "]",
        callback: () => clickRel("next"),
        options: { ignoreInputs: true },
      },
    ]
  );

  useHotkeySequences(
    [
      { sequence: ["G", "H"], callback: () => go("") },
      { sequence: ["G", "S"], callback: () => go("search") },
      { sequence: ["G", "P"], callback: () => go("pokemon") },
      { sequence: ["G", "B"], callback: () => go("berries") },
      { sequence: ["G", "I"], callback: () => go("items") },
      { sequence: ["G", "L"], callback: () => go("locations") },
      { sequence: ["G", "M"], callback: () => go("moves") },
      { sequence: ["G", "G"], callback: () => go("generations") },
    ],
    { ignoreInputs: true }
  );

  return <>{children}</>;
}

export function HotkeysProvider({ children }: Props) {
  return (
    <TanstackHotkeysProvider>
      <HotkeyBindings>{children}</HotkeyBindings>
    </TanstackHotkeysProvider>
  );
}
