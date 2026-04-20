import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { pokemonIndexQuery } from "~/lib/queries";
import { PokemonCard } from "~/components/PokemonCard";
import { makeT } from "~/i18n";

export const Route = createFileRoute("/$lang/pokemon/")({
  loader: async ({ context, params }) => {
    if (!isLocale(params.lang)) return;
    await context.queryClient.ensureQueryData(pokemonIndexQuery(params.lang));
  },
  component: PokemonListPage,
  head: ({ params }) => ({
    meta: [{ title: `Pokémon — ${params.lang === "fr" ? "Pokédex" : "Pokédex"}` }],
  }),
});

function PokemonListPage() {
  const { lang } = Route.useParams();
  if (!isLocale(lang)) return null;
  const t = makeT(lang);
  const { data } = useSuspenseQuery(pokemonIndexQuery(lang));
  return (
    <div className="catalog">
      <header className="catalog-header">
        <h1>{t("list_pokemon_heading")}</h1>
        <p>{t("list_pokemon_subtitle")} — {data.total}</p>
      </header>
      <div className="pokemon-grid">
        {data.entries.map((entry) => (
          <PokemonCard key={entry.name} entry={entry} locale={lang} />
        ))}
      </div>
    </div>
  );
}
