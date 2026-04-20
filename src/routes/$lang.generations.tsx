import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { generationIndexQuery } from "~/lib/queries";
import { CatalogShell } from "~/components/CatalogShell";

export const Route = createFileRoute("/$lang/generations")({
  loader: async ({ context, params }) => {
    if (!isLocale(params.lang)) return;
    await context.queryClient.ensureQueryData(generationIndexQuery(params.lang));
  },
  component: GenerationListPage,
  head: ({ params }) => ({ meta: [{ title: `Generations · ${params.lang}` }] }),
});

function GenerationListPage() {
  const { lang } = Route.useParams();
  if (!isLocale(lang)) return null;
  const { data } = useSuspenseQuery(generationIndexQuery(lang));

  return (
    <CatalogShell title="Generations" lede="The Pokémon games, by era." count={data.total}>
      <ul className="grid-cards" aria-label="Generations">
        {data.entries.map((entry) => (
          <li key={entry.name}>
            <Link
              to="/$lang/generation/$name"
              params={{ lang, name: entry.name }}
              className="pokemon-card"
            >
              <div className="pokemon-card__name">{entry.display_name}</div>
              <div className="pokemon-card__id">{entry.main_region.toUpperCase()}</div>
              <div className="pokemon-card__id">{entry.species_count} species</div>
            </Link>
          </li>
        ))}
      </ul>
    </CatalogShell>
  );
}
