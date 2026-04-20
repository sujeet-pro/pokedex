export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export const DEFAULT_LOCALE: Locale = "en";
