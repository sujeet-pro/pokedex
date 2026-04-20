import { Dialog } from "radix-ui";
import { Link } from "@tanstack/react-router";
import type { Locale } from "~/types/locales";
import { makeT } from "~/i18n";
import type { MessageKey } from "~/i18n";

type Props = { locale: Locale };

type NavItem =
  | { kind: "typed"; key: MessageKey; to: "/$lang" | "/$lang/pokemon"; exact?: boolean }
  | { kind: "path"; key: MessageKey; path: string };

const NAV_ITEMS: NavItem[] = [
  { kind: "typed", key: "nav_home", to: "/$lang", exact: true },
  { kind: "typed", key: "nav_pokemon", to: "/$lang/pokemon" },
  { kind: "path", key: "nav_types", path: "types" },
  { kind: "path", key: "nav_abilities", path: "abilities" },
  { kind: "path", key: "nav_berries", path: "berries" },
  { kind: "path", key: "nav_items", path: "items" },
  { kind: "path", key: "nav_moves", path: "moves" },
  { kind: "path", key: "nav_locations", path: "locations" },
  { kind: "path", key: "nav_generations", path: "generations" },
  { kind: "path", key: "nav_search", path: "search" },
];

export function BurgerMenu({ locale }: Props) {
  const t = makeT(locale);
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL.slice(0, -1)
    : import.meta.env.BASE_URL;

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="pill-button"
          aria-label={t("menu_open")}
        >
          <span aria-hidden="true">≡</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="burger-overlay" />
        <Dialog.Content className="settings" aria-label={t("menu_open")}>
          <Dialog.Title className="settings__label">
            {t("app_title")}
          </Dialog.Title>
          <nav aria-label="Primary" className="pill-list">
            {NAV_ITEMS.map((item) => {
              if (item.kind === "typed") {
                return (
                  <Dialog.Close asChild key={item.key}>
                    <Link
                      to={item.to}
                      params={{ lang: locale }}
                      className="pill"
                      activeOptions={item.exact ? { exact: true } : undefined}
                    >
                      {t(item.key)}
                    </Link>
                  </Dialog.Close>
                );
              }
              return (
                <Dialog.Close asChild key={item.key}>
                  <a
                    className="pill"
                    href={`${base}/${locale}/${item.path}`}
                  >
                    {t(item.key)}
                  </a>
                </Dialog.Close>
              );
            })}
          </nav>
          <Dialog.Close asChild>
            <button type="button" className="pill-button" aria-label={t("menu_close")}>
              {t("menu_close")}
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
