import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { berryIndexQuery } from "~/lib/queries";
import { CatalogShell } from "~/components/CatalogShell";
import { TypeCartridge } from "~/components/TypeCartridge";

export const Route = createFileRoute("/$lang/berries")({
  loader: async ({ context, params }) => {
    if (!isLocale(params.lang)) return;
    await context.queryClient.ensureQueryData(berryIndexQuery(params.lang));
  },
  component: BerryListPage,
  head: ({ params }) => ({ meta: [{ title: `Berries · ${params.lang}` }] }),
});

function BerryListPage() {
  const { lang } = Route.useParams();
  if (!isLocale(lang)) return null;
  const { data } = useSuspenseQuery(berryIndexQuery(lang));

  return (
    <CatalogShell title="Berries" lede="Every berry in the catalog." count={data.total}>
      <ul className="grid-cards" aria-label="Berries">
        {data.entries.map((entry) => (
          <li key={entry.name}>
            <Link
              to="/$lang/berry/$name"
              params={{ lang, name: entry.name }}
              className="pokemon-card"
            >
              <div className="pokemon-card__name">{entry.display_name}</div>
              <div className="pokemon-card__id">{entry.firmness}</div>
              <ul className="pokemon-card__types pill-list" aria-label="Natural gift">
                <li>
                  <TypeCartridge name={entry.natural_gift_type} size="sm" />
                </li>
              </ul>
            </Link>
          </li>
        ))}
      </ul>
    </CatalogShell>
  );
}
