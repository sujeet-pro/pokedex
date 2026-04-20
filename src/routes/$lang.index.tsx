import { createFileRoute, Link } from "@tanstack/react-router";
import { isLocale } from "~/types/locales";
import { makeT } from "~/i18n";
import { Pokeball } from "~/components/Pokeball";

export const Route = createFileRoute("/$lang/")({
  component: LocaleHome,
});

function LocaleHome() {
  const { lang } = Route.useParams();
  if (!isLocale(lang)) return null;
  const t = makeT(lang);
  return (
    <div className="landing" style={{ margin: "2rem auto" }}>
      <Pokeball />
      <h1>{t("app_title")}</h1>
      <p>{t("tagline")}</p>
      <div className="landing-picker">
        <Link to="/$lang/pokemon" params={{ lang }}>
          {t("nav_pokemon")}
        </Link>
      </div>
    </div>
  );
}
