import { LOCALES, type Locale } from "~/types/locales";
import { makeT } from "~/i18n";

type Props = { locale: Locale };

/**
 * Compute the equivalent URL with `nextLocale` swapped into the first
 * path segment below the site's basepath (`/pokedex/`). Handles the case
 * where no locale segment is present (root landing) by appending it.
 */
function buildLocalizedHref(nextLocale: Locale): string {
  if (typeof window === "undefined") return "#";
  const base = import.meta.env.BASE_URL; // e.g. "/pokedex/"
  const { pathname, search, hash } = window.location;

  // Strip base prefix (if present) so `rest` is the app-relative path.
  const normBase = base.endsWith("/") ? base : `${base}/`;
  let rest = pathname;
  if (pathname === normBase.slice(0, -1) || pathname === normBase) {
    rest = "/";
  } else if (pathname.startsWith(normBase)) {
    rest = `/${pathname.slice(normBase.length)}`;
  }

  // Split on "/" and replace the first segment if it's a known locale.
  const segments = rest.split("/").filter(Boolean);
  const first = segments[0];
  if (first && (LOCALES as readonly string[]).includes(first)) {
    segments[0] = nextLocale;
  } else {
    segments.unshift(nextLocale);
  }

  const newRest = `/${segments.join("/")}`;
  const finalBase = normBase.endsWith("/") ? normBase.slice(0, -1) : normBase;
  return `${finalBase}${newRest}${search}${hash}`;
}

export function LocaleSwitcher({ locale }: Props) {
  const t = makeT(locale);

  const onClick = (next: Locale) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (next === locale) {
      e.preventDefault();
      return;
    }
    try {
      window.localStorage.setItem("pokedex.locale", next);
    } catch {
      // ignore
    }
    // Allow the default navigation (full page load) to proceed.
  };

  return (
    <div className="navbar__controls" role="group" aria-label={t("lang_switch_to_en")}>
      {LOCALES.map((loc) => {
        const href = buildLocalizedHref(loc);
        const active = loc === locale;
        const label = loc === "en" ? t("lang_switch_to_en") : t("lang_switch_to_fr");
        return (
          <a
            key={loc}
            href={href}
            className="pill-button"
            aria-pressed={active}
            aria-current={active ? "true" : undefined}
            hrefLang={loc}
            onClick={onClick(loc)}
          >
            {label}
          </a>
        );
      })}
    </div>
  );
}
