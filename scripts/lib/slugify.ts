/**
 * ASCII-ish URL slug from a display string.
 *
 * Strips diacritics (é → e), lowercases, replaces non-alnum runs
 * with dashes, and trims/collapses dashes. Returns `fallback` (or the
 * sanitized input if non-empty) when the result is empty.
 */
export function slugify(input: string, fallback?: string): string {
  const cleaned = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  if (cleaned.length > 0) return cleaned;
  if (fallback) return fallback;
  return "item";
}

/**
 * Build a locale-slug map from (canonical name, localized display name).
 *
 * If a locale's display name is missing, falls back to the canonical
 * slug so URLs stay valid for entities that lack translations.
 */
export function slugMap(
  canonical: string,
  displayNames: Record<string, string | undefined>,
): Record<string, string> {
  const canonSlug = slugify(canonical, canonical);
  const out: Record<string, string> = {};
  for (const lang of Object.keys(displayNames)) {
    const dn = displayNames[lang];
    out[lang] = dn ? slugify(dn, canonSlug) : canonSlug;
  }
  return out;
}
