import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { makeT } from "~/i18n";
import { pokemonIndexQuery } from "~/lib/queries";

export const Route = createFileRoute("/$lang/")({
  loader: async ({ context, params }) => {
    if (!isLocale(params.lang)) return;
    await context.queryClient.ensureQueryData(pokemonIndexQuery(params.lang));
  },
  component: LocaleHome,
});

function LocaleHome() {
  const { lang } = Route.useParams();
  if (!isLocale(lang)) return null;
  const t = makeT(lang);
  const { data } = useSuspenseQuery(pokemonIndexQuery(lang));

  return (
    <div>
      <header className="hero-head">
        <h1 className="page-title">{t("app_title")}</h1>
        <p className="page-lede">{t("tagline")}</p>
      </header>
      <div className="nav-buttons">
        <Link to="/$lang/pokemon" params={{ lang }} className="hero-cta">
          {t("nav_pokemon")} · {data.total}
        </Link>
      </div>
    </div>
  );
}
