import type { Locale } from "~/types/locales";

/**
 * Map our app locale to a BCP-47 tag preferred by SpeechSynthesis voices.
 * We keep this permissive — voice-matching code takes the prefix and falls
 * back to `startsWith`.
 */
const LOCALE_TO_BCP47: Record<Locale, string> = {
  en: "en-US",
  fr: "fr-FR",
};

export function bcp47ForLocale(locale: Locale): string {
  return LOCALE_TO_BCP47[locale];
}

/**
 * Strip HTML tags from a `summary_html` string to get the plain-text that
 * will actually be spoken. Preserves whitespace and collapses runs of
 * whitespace to a single space to match the SpeechSynthesis engine's idea
 * of word boundaries.
 *
 * Browser-only (uses DOMParser). SSR-safe fallback removes tags via regex.
 */
export function htmlToPlainText(html: string): string {
  if (typeof window !== "undefined" && typeof window.DOMParser !== "undefined") {
    const doc = new window.DOMParser().parseFromString(html, "text/html");
    return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
  }
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Choose a `SpeechSynthesisVoice` for the given language tag / optional
 * voice name. Returns `null` when nothing plausible is available (the
 * utterance will then fall back to the engine's default).
 */
export function pickVoice(
  voices: SpeechSynthesisVoice[],
  lang: string,
  preferredName?: string | null
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  if (preferredName) {
    const exact = voices.find((v) => v.name === preferredName);
    if (exact) return exact;
  }

  const prefix = lang.split("-")[0] ?? lang;

  const exactLang = voices.find((v) => v.lang === lang);
  if (exactLang) return exactLang;

  const loosePrefix = voices.find((v) => v.lang.toLowerCase().startsWith(prefix.toLowerCase()));
  if (loosePrefix) return loosePrefix;

  return null;
}
