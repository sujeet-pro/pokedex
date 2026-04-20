import { Link } from "@tanstack/react-router";
import type { Locale } from "~/types/locales";
import { makeT } from "~/i18n";
import { Settings } from "./Settings";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { BurgerMenu } from "./BurgerMenu";

type Props = { locale: Locale };

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
        <div className="navbar__spacer" />
        <div className="navbar__controls">
          <LocaleSwitcher locale={locale} />
          <Settings locale={locale} />
          <BurgerMenu locale={locale} />
        </div>
      </div>
    </header>
  );
}
