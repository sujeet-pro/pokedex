import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { moveIndexQuery } from "~/lib/queries";
import { CatalogShell } from "~/components/CatalogShell";
import { TypeCartridge } from "~/components/TypeCartridge";

export const Route = createFileRoute("/$lang/moves")({
  loader: async ({ context, params }) => {
    if (!isLocale(params.lang)) return;
    await context.queryClient.ensureQueryData(moveIndexQuery(params.lang));
  },
  component: MoveListPage,
  head: ({ params }) => ({ meta: [{ title: `Moves · ${params.lang}` }] }),
});

function MoveListPage() {
  const { lang } = Route.useParams();
  if (!isLocale(lang)) return null;
  const { data } = useSuspenseQuery(moveIndexQuery(lang));

  return (
    <CatalogShell title="Moves" lede="Attacks and status techniques." count={data.total}>
      <ul className="grid-cards" aria-label="Moves">
        {data.entries.map((entry) => (
          <li key={entry.name}>
            <Link
              to="/$lang/move/$name"
              params={{ lang, name: entry.name }}
              className="pokemon-card"
            >
              <div className="pokemon-card__name">{entry.display_name}</div>
              <ul className="pokemon-card__types pill-list" aria-label="Type">
                <li><TypeCartridge name={entry.type} size="sm" /></li>
              </ul>
              <div className="pokemon-card__id">
                {entry.damage_class} · PWR {entry.power ?? "—"} · ACC {entry.accuracy ?? "—"} · PP {entry.pp ?? "—"}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </CatalogShell>
  );
}
