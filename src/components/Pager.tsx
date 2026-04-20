import { Link } from "@tanstack/react-router";
import type { Locale } from "~/types/locales";

type Entry = { name: string; id: number } | null;
type Props = {
  locale: Locale;
  prev: Entry;
  next: Entry;
  prevLabel: string;
  nextLabel: string;
  labelText: string;
  to: "/$lang/pokemon/$name";
};

export function Pager({ locale, prev, next, prevLabel, nextLabel, labelText, to }: Props) {
  return (
    <nav className="pager" aria-label={labelText}>
      {prev ? (
        <Link
          to={to}
          params={{ lang: locale, name: prev.name }}
          className="pill-button pager__prev"
          rel="prev"
        >
          ← {prevLabel}
        </Link>
      ) : (
        <span className="pill-button pager__prev" aria-disabled="true" style={{ opacity: 0.35 }}>
          ← {prevLabel}
        </span>
      )}
      <span className="pager__label">{labelText}</span>
      {next ? (
        <Link
          to={to}
          params={{ lang: locale, name: next.name }}
          className="pill-button pager__next"
          rel="next"
        >
          {nextLabel} →
        </Link>
      ) : (
        <span className="pill-button pager__next" aria-disabled="true" style={{ opacity: 0.35 }}>
          {nextLabel} →
        </span>
      )}
    </nav>
  );
}
