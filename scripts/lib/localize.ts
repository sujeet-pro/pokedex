import type { EffectEntry, FlavorTextEntry, GenusEntry, LanguageRef, NameEntry } from "./pokeapi";

export function pickByLocale<T extends LanguageRef>(
  entries: T[] | undefined,
  lang: string,
  fallbackLang = "en",
): T | undefined {
  if (!entries) return undefined;
  return (
    entries.find((e) => e.language.name === lang) ??
    entries.find((e) => e.language.name === fallbackLang)
  );
}

export function pickName(entries: NameEntry[] | undefined, lang: string, fallback: string): string {
  const hit = pickByLocale(entries, lang);
  return hit?.name ?? fallback;
}

export function pickGenus(entries: GenusEntry[] | undefined, lang: string): string {
  const hit = pickByLocale(entries, lang);
  return hit?.genus ?? "";
}

export function pickFlavor(entries: FlavorTextEntry[] | undefined, lang: string): string {
  const hit = pickByLocale(entries, lang);
  return hit ? cleanFlavor(hit.flavor_text) : "";
}

export function pickEffect(entries: EffectEntry[] | undefined, lang: string): EffectEntry | undefined {
  return pickByLocale(entries, lang);
}

export function cleanFlavor(text: string): string {
  return text
    .replace(/\u00ad/g, "")
    .replace(/\f/g, " ")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function paragraphHtml(text: string): string {
  if (!text) return "";
  return `<p>${escapeHtml(text)}</p>`;
}
