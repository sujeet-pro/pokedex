import { LOCALES, type Locale } from "~/types/locales";
import { useCurrentEntity } from "~/hooks/useCurrentEntity";
import { makeT } from "~/i18n";

type Props = { locale: Locale };

/** Map resource kind → URL segment (locations is list-only). */
const RESOURCE_URL_SEGMENT: Record<string, string> = {
  pokemon: "pokemon",
  "pokemon-species": "pokemon-species",
  "pokemon-form": "pokemon-form",
  type: "type",
  ability: "ability",
  berry: "berry",
  item: "item",
  move: "move",
  generation: "generation",
};

/**
 * Compute the equivalent URL with `nextLocale` swapped into the first
 * path segment below the site's basepath (`/pokedex/`). If a detail
 * entity is registered via CurrentEntityProvider, also swap the slug
 * for the target locale (canonical URL).
 */
export function buildLocalizedHref(
  nextLocale: Locale,
  entity: { resource: string; slugs: Record<Locale, string> } | null,
): string {
  if (typeof window === "undefined") return "#";
  const base = import.meta.env.BASE_URL; // e.g. "/pokedex/"
  const { pathname, search, hash } = window.location;

  const normBase = base.endsWith("/") ? base : `${base}/`;
  let rest = pathname;
  if (pathname === normBase.slice(0, -1) || pathname === normBase) {
    rest = "/";
  } else if (pathname.startsWith(normBase)) {
    rest = `/${pathname.slice(normBase.length)}`;
  }

  const segments = rest.split("/").filter(Boolean);
  const first = segments[0];
  if (first && (LOCALES as readonly string[]).includes(first)) {
    segments[0] = nextLocale;
  } else {
    segments.unshift(nextLocale);
  }

  // If we have a current entity, swap the last segment for its localized slug.
  if (entity && segments.length >= 3) {
    const kindSegment = RESOURCE_URL_SEGMENT[entity.resource];
    if (kindSegment && segments[1] === kindSegment) {
      segments[2] = entity.slugs[nextLocale] ?? segments[2];
    }
  }

  const newRest = `/${segments.join("/")}`;
  const finalBase = normBase.endsWith("/") ? normBase.slice(0, -1) : normBase;
  return `${finalBase}${newRest}${search}${hash}`;
}

/**
 * Compact two-button locale switcher, rendered inside the Settings
 * popover (no longer in the navbar).
 */
export function LocaleSwitcher({ locale }: Props) {
  const t = makeT(locale);
  const entity = useCurrentEntity();

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
    // Default full-page navigation proceeds.
  };

  return (
    <div className="control-group" role="group" aria-label={t("settings_language")}>
      {LOCALES.map((loc) => {
        const href = buildLocalizedHref(loc, entity);
        const active = loc === locale;
        const label = loc === "en" ? t("lang_switch_to_en") : t("lang_switch_to_es");
        return (
          <a
            key={loc}
            href={href}
            data-state={active ? "on" : undefined}
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
