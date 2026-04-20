import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { locationIndexQuery } from "~/lib/queries";
import { CatalogShell } from "~/components/CatalogShell";
import { LocationCard } from "~/components/LocationCard";

export const Route = createFileRoute("/$lang/locations")({
  loader: async ({ context, params }) => {
    if (!isLocale(params.lang)) return;
    await context.queryClient.ensureQueryData(locationIndexQuery(params.lang));
  },
  component: LocationListPage,
  head: ({ params }) => ({ meta: [{ title: `Locations · ${params.lang}` }] }),
});

function LocationListPage() {
  const { lang } = Route.useParams();
  if (!isLocale(lang)) return null;
  const { data } = useSuspenseQuery(locationIndexQuery(lang));

  // Group by region.
  const byRegion = new Map<string, typeof data.entries>();
  for (const entry of data.entries) {
    const key = entry.region || "other";
    const list = byRegion.get(key) ?? [];
    list.push(entry);
    byRegion.set(key, list);
  }

  return (
    <CatalogShell title="Locations" lede="Regions and areas." count={data.total}>
      {Array.from(byRegion.entries()).map(([region, entries]) => (
        <div key={region} className="panel">
          <div className="panel__title">{region.toUpperCase()} · {entries.length}</div>
          <ul className="grid-cards" aria-label={`${region} locations`}>
            {entries.map((entry) => (
              <li key={entry.name}>
                <LocationCard entry={entry} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </CatalogShell>
  );
}
