import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { pokemonIndexQuery } from "~/lib/queries";
import { PokemonCard } from "~/components/PokemonCard";
import { CatalogShell } from "~/components/CatalogShell";
import { makeT } from "~/i18n";

export const Route = createFileRoute("/$lang/pokemon/")({
  loader: async ({ context, params }) => {
    if (!isLocale(params.lang)) return;
    await context.queryClient.ensureQueryData(pokemonIndexQuery(params.lang));
  },
  component: PokemonListPage,
  head: ({ params }) => ({ meta: [{ title: `Pokémon · ${params.lang}` }] }),
});

function PokemonListPage() {
  const { lang } = Route.useParams();
  if (!isLocale(lang)) return null;
  const t = makeT(lang);
  const { data } = useSuspenseQuery(pokemonIndexQuery(lang));

  return (
    <CatalogShell
      title={t("list_pokemon_heading")}
      lede={t("list_pokemon_subtitle")}
      count={data.total}
    >
      <ul className="grid-cards" aria-label="Pokémon list">
        {data.entries.map((entry) => (
          <li key={entry.name}>
            <PokemonCard entry={entry} locale={lang} />
          </li>
        ))}
      </ul>
    </CatalogShell>
  );
}
