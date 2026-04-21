import { DropdownMenu } from "radix-ui";
import { Link } from "@tanstack/react-router";
import type { Locale } from "~/types/locales";
import type { MessageKey } from "~/i18n";
import { makeT } from "~/i18n";

type Props = { locale: Locale };

type NavItem =
  | { kind: "typed"; key: MessageKey; to: "/$lang/pokemon" }
  | { kind: "path"; key: MessageKey; path: string };

const NAV_ITEMS: NavItem[] = [
  { kind: "typed", key: "nav_pokemon", to: "/$lang/pokemon" },
  { kind: "path", key: "nav_berries", path: "berries" },
  { kind: "path", key: "nav_moves", path: "moves" },
  { kind: "path", key: "nav_abilities", path: "abilities" },
  { kind: "path", key: "nav_items", path: "items" },
  { kind: "path", key: "nav_types", path: "types" },
  { kind: "path", key: "nav_generations", path: "generations" },
  { kind: "path", key: "nav_locations", path: "locations" },
];

/**
 * Browse dropdown: primary nav, attached to a compact button in the
 * navbar. Each item links to that entity's landing (filter) page.
 */
export function BurgerMenu({ locale }: Props) {
  const t = makeT(locale);
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL.slice(0, -1)
    : import.meta.env.BASE_URL;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="icon-button"
          aria-label={t("nav_browse")}
        >
          <svg viewBox="0 0 24 24" aria-hidden>
            <path
              d="M3 6h18M3 12h18M3 18h18"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </svg>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="browse-menu"
          align="start"
          sideOffset={8}
          aria-label={t("nav_browse")}
        >
          {NAV_ITEMS.map((item) => (
            <DropdownMenu.Item key={item.key} asChild>
              {item.kind === "typed" ? (
                <Link
                  to={item.to}
                  params={{ lang: locale }}
                  className="browse-menu__item"
                >
                  {t(item.key)}
                </Link>
              ) : (
                <a
                  className="browse-menu__item"
                  href={`${base}/${locale}/${item.path}`}
                >
                  {t(item.key)}
                </a>
              )}
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Arrow className="settings__arrow" width={12} height={6} />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
