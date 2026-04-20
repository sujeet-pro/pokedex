import { Link } from "@tanstack/react-router";
import type { Locale } from "~/types/locales";
import { Pokeball } from "./Pokeball";
import { makeT } from "~/i18n";

type Props = { locale: Locale };

export function Navbar({ locale }: Props) {
  const t = makeT(locale);
  return (
    <header className="navbar">
      <Link to="/$lang" params={{ lang: locale }} className="navbar-brand" aria-label={t("app_title")}>
        <Pokeball />
        <span>{t("app_title")}</span>
      </Link>
      <nav className="navbar-links" aria-label="Primary">
        <Link to="/$lang" params={{ lang: locale }} activeOptions={{ exact: true }}>
          {t("nav_home")}
        </Link>
        <Link to="/$lang/pokemon" params={{ lang: locale }}>
          {t("nav_pokemon")}
        </Link>
      </nav>
    </header>
  );
}
