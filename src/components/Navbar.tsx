import { Link } from "@tanstack/react-router";
import type { Locale } from "~/types/locales";
import { makeT } from "~/i18n";
import { Settings } from "./Settings";
import { BurgerMenu } from "./BurgerMenu";
import { useSearchDialog } from "~/hooks/useSearchDialog";

type Props = { locale: Locale };

function SearchTrigger({ locale }: { locale: Locale }) {
  const { setOpen } = useSearchDialog();
  const t = makeT(locale);
  return (
    <button
      type="button"
      className="search__input search__input--has-kbd"
      onClick={() => setOpen(true)}
      aria-label={t("nav_search")}
      style={{ textAlign: "start", maxWidth: "320px" }}
    >
      <span>{t("search_placeholder")}</span>
      <span className="search__kbd" aria-hidden>
        <span>⌘</span>
        <span>K</span>
      </span>
    </button>
  );
}

export function Navbar({ locale }: Props) {
  const t = makeT(locale);
  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/$lang" params={{ lang: locale }} className="navbar__brand" aria-label={t("app_title")}>
          Pokédex
        </Link>
        <nav className="navbar__controls navbar__controls--primary" aria-label="Primary">
          <Link to="/$lang" params={{ lang: locale }} className="pill" activeOptions={{ exact: true }}>
            {t("nav_home")}
          </Link>
          <Link to="/$lang/pokemon" params={{ lang: locale }} className="pill">
            {t("nav_pokemon")}
          </Link>
        </nav>
        <div className="navbar__search">
          <SearchTrigger locale={locale} />
        </div>
        <div className="navbar__controls">
          <Settings locale={locale} />
          <BurgerMenu locale={locale} />
        </div>
      </div>
    </header>
  );
}
