import { Link } from "@tanstack/react-router";
import type { Locale } from "~/types/locales";

type Entry = {
  name: string;
  slug: string;
  id: number;
  display_name?: string;
  /** Optional sprite URL rendered inside the pill. Pixel-art for berries/items. */
  iconSrc?: string;
  /** Render the icon with `image-rendering: pixelated` (default true). */
  iconPixel?: boolean;
} | null;

type Props = {
  locale: Locale;
  prev: Entry;
  next: Entry;
  /** First-line action label, e.g. "Previous". */
  prevLabel: string;
  /** First-line action label, e.g. "Next". */
  nextLabel: string;
  /** Optional second-line entity name for the prev button. */
  prevName?: string;
  /** Optional second-line entity name for the next button. */
  nextName?: string;
  labelText: string;
  /** Any detail-route pattern with /$lang/.../$name. Widened to string so
   *  the same component works for type, ability, item, etc. */
  to: string;
};

function PagerSprite({ entry }: { entry: NonNullable<Entry> }) {
  if (!entry.iconSrc) return null;
  return (
    <img
      className={`pager__sprite${entry.iconPixel === false ? "" : " pager__sprite--pixel"}`}
      src={entry.iconSrc}
      alt=""
      loading="lazy"
      width={40}
      height={40}
    />
  );
}

export function Pager({
  locale,
  prev,
  next,
  prevLabel,
  nextLabel,
  prevName,
  nextName,
  labelText,
  to,
}: Props) {
  return (
    <nav className="pager" aria-label={labelText}>
      {prev ? (
        <Link
          to={to as never}
          params={{ lang: locale, name: prev.slug } as never}
          className="pager__btn pager__prev"
          rel="prev"
        >
          <PagerSprite entry={prev} />
          <span className="pager__stack">
            <span className="pager__line pager__line--action">
              <kbd className="pager__kbd" aria-hidden>[</kbd>
              <span className="pager__arrow" aria-hidden>←</span>
              <span className="pager__text">{prevLabel}</span>
            </span>
            {prevName ? (
              <span className="pager__line pager__line--name" title={prevName}>
                {prevName}
              </span>
            ) : null}
          </span>
        </Link>
      ) : (
        <span className="pager__btn pager__prev pager__btn--disabled" aria-disabled="true">
          <span className="pager__stack">
            <span className="pager__line pager__line--action">
              <kbd className="pager__kbd" aria-hidden>[</kbd>
              <span className="pager__arrow" aria-hidden>←</span>
              <span className="pager__text">{prevLabel}</span>
            </span>
          </span>
        </span>
      )}
      <span className="pager__label">{labelText}</span>
      {next ? (
        <Link
          to={to as never}
          params={{ lang: locale, name: next.slug } as never}
          className="pager__btn pager__next"
          rel="next"
        >
          <span className="pager__stack pager__stack--end">
            <span className="pager__line pager__line--action">
              <span className="pager__text">{nextLabel}</span>
              <span className="pager__arrow" aria-hidden>→</span>
              <kbd className="pager__kbd" aria-hidden>]</kbd>
            </span>
            {nextName ? (
              <span className="pager__line pager__line--name" title={nextName}>
                {nextName}
              </span>
            ) : null}
          </span>
          <PagerSprite entry={next} />
        </Link>
      ) : (
        <span className="pager__btn pager__next pager__btn--disabled" aria-disabled="true">
          <span className="pager__stack pager__stack--end">
            <span className="pager__line pager__line--action">
              <span className="pager__text">{nextLabel}</span>
              <span className="pager__arrow" aria-hidden>→</span>
              <kbd className="pager__kbd" aria-hidden>]</kbd>
            </span>
          </span>
        </span>
      )}
    </nav>
  );
}
