import { Pager } from "./Pager";
import type { Locale } from "~/types/locales";
import { makeT } from "~/i18n";

type Ref = { id: number; slug: string; display_name: string; name?: string };

type Props<E extends Ref> = {
  locale: Locale;
  /** Index entries sorted in the order the Pager should traverse. */
  entries: E[];
  /** Canonical locale-specific slug of the entity currently rendered. */
  currentSlug: string;
  /** TanStack route pattern — e.g. "/$lang/type/$name". Widened at runtime. */
  to: string;
  /** Short label rendered in the center (typically display_name). */
  labelText: string;
  /** Optional callback returning a sprite URL for the prev/next entry. */
  iconResolver?: (entry: E) => string | undefined;
  /** Whether the icon is pixel art (default true). */
  iconPixel?: boolean;
};

/** Generic prev/next pager that reads from an index bundle's `entries`. */
export function EntityPager<E extends Ref>({
  locale,
  entries,
  currentSlug,
  to,
  labelText,
  iconResolver,
  iconPixel = true,
}: Props<E>) {
  const t = makeT(locale);
  const idx = entries.findIndex((e) => e.slug === currentSlug);
  const prev = idx > 0 ? entries[idx - 1]! : null;
  const next = idx >= 0 && idx < entries.length - 1 ? entries[idx + 1]! : null;

  const decorate = (e: E) => ({
    ...e,
    name: e.name ?? e.slug,
    iconSrc: iconResolver?.(e),
    iconPixel,
  });

  return (
    <Pager
      locale={locale}
      prev={prev ? decorate(prev) : null}
      next={next ? decorate(next) : null}
      prevLabel={t("detail_pager_prev")}
      nextLabel={t("detail_pager_next")}
      prevName={prev?.display_name}
      nextName={next?.display_name}
      labelText={labelText}
      to={to}
    />
  );
}
