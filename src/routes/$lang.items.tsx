import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { itemIndexQuery } from "~/lib/queries";
import { CatalogShell } from "~/components/CatalogShell";

export const Route = createFileRoute("/$lang/items")({
  loader: async ({ context, params }) => {
    if (!isLocale(params.lang)) return;
    await context.queryClient.ensureQueryData(itemIndexQuery(params.lang));
  },
  component: ItemListPage,
  head: ({ params }) => ({ meta: [{ title: `Items · ${params.lang}` }] }),
});

function ItemListPage() {
  const { lang } = Route.useParams();
  if (!isLocale(lang)) return null;
  const { data } = useSuspenseQuery(itemIndexQuery(lang));

  return (
    <CatalogShell title="Items" lede="All catalog items." count={data.total}>
      <ul className="grid-cards" aria-label="Items">
        {data.entries.map((entry) => (
          <li key={entry.name}>
            <Link
              to="/$lang/item/$name"
              params={{ lang, name: entry.slug }}
              className="pokemon-card"
            >
              <div className="pokemon-card__name">{entry.display_name}</div>
              <div className="pokemon-card__id">{entry.category}</div>
              <div className="pokemon-card__id">¥{entry.cost}</div>
            </Link>
          </li>
        ))}
      </ul>
    </CatalogShell>
  );
}
