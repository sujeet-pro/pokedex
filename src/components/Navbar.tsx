import { Link } from "@tanstack/react-router";
import type { Locale } from "~/types/locales";
import { makeT } from "~/i18n";
import { Settings } from "./Settings";
import { BurgerMenu } from "./BurgerMenu";
import { useSearchDialog } from "~/hooks/useSearchDialog";

type Props = { locale: Locale };

function SearchBar({ locale }: { locale: Locale }) {
  const { setOpen } = useSearchDialog();
  const t = makeT(locale);
  return (
    <button
      type="button"
      className="search__input search__input--has-kbd navbar__search-input"
      onClick={() => setOpen(true)}
      aria-label={t("nav_search")}
    >
      <span>{t("search_placeholder")}</span>
      <span className="search__kbd" aria-hidden>
        <span>⌘</span>
        <span>K</span>
      </span>
    </button>
  );
}

function SearchIconButton({ locale }: { locale: Locale }) {
  const { setOpen } = useSearchDialog();
  const t = makeT(locale);
  return (
    <button
      type="button"
      className="icon-button navbar__search-icon"
      onClick={() => setOpen(true)}
      aria-label={t("nav_search")}
    >
      <svg viewBox="0 0 24 24" aria-hidden>
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth={2} />
        <path d="M16.5 16.5L21 21" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      </svg>
    </button>
  );
}

export function Navbar({ locale }: Props) {
  const t = makeT(locale);
  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <div className="navbar__left">
          <BurgerMenu locale={locale} />
          <Link
            to="/$lang"
            params={{ lang: locale }}
            className="navbar__brand"
            aria-label={t("app_title")}
          >
            Pokédex
          </Link>
        </div>
        <div className="navbar__right">
          <SearchBar locale={locale} />
          <SearchIconButton locale={locale} />
          <Settings locale={locale} />
        </div>
      </div>
    </header>
  );
}
