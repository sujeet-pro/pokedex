import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { berryBundleQuery } from "~/lib/queries";
import { BundleError } from "~/lib/bundles";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { TypeCartridge } from "~/components/TypeCartridge";
import { DossierField } from "~/components/DossierField";
import { ReadoutGrid } from "~/components/ReadoutGrid";

export const Route = createFileRoute("/$lang/berry/$name")({
  loader: async ({ context, params }) => {
    if (!isLocale(params.lang)) throw notFound();
    try {
      await context.queryClient.ensureQueryData(berryBundleQuery(params.lang, params.name));
    } catch (err) {
      if (err instanceof BundleError && err.status === 404) throw notFound();
      throw err;
    }
  },
  component: BerryDetailPage,
  head: ({ params }) => ({ meta: [{ title: `${params.name} · Berry · Pokédex` }] }),
});

function BerryDetailPage() {
  const { lang, name } = Route.useParams();
  if (!isLocale(lang)) return null;
  const { data } = useSuspenseQuery(berryBundleQuery(lang, name));

  return (
    <>
      <ConsoleDevice
        title={data.display_name}
        subtitle={`BERRY · ${data.firmness.toUpperCase()}`}
      >
        <div className="hud__column">
          <p className="hud-row"><b>BERRY</b>&nbsp;&nbsp;{data.name}</p>
          <h1 className="hud-name">{data.display_name}</h1>
          <p className="hud-genus">{data.item.display_name}</p>

          <ul className="cart-row pill-list" aria-label="Natural gift type">
            <li><TypeCartridge name={data.natural_gift_type} locale={lang} asLink /></li>
          </ul>

          <div className="hud-card">
            <div className="hud-card__title"><span>Growth</span></div>
            <ReadoutGrid
              items={[
                { label: "Growth", value: data.growth_time, unit: "h" },
                { label: "Harvest", value: data.max_harvest },
                { label: "Size", value: data.size, unit: "mm" },
                { label: "Soil", value: data.soil_dryness },
                { label: "Smooth", value: data.smoothness },
                { label: "Power", value: data.natural_gift_power },
              ]}
            />
          </div>
        </div>
      </ConsoleDevice>

      <div className="panel">
        <div className="panel__title">Flavors</div>
        <ul className="dossier-list">
          {data.flavors.map((f) => (
            <li key={f.name}>
              <DossierField term={f.name} value={f.potency} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
