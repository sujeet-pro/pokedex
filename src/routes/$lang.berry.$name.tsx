import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { berryBundleQuery, berryIndexQuery } from "~/lib/queries";
import { BundleError } from "~/lib/bundles";
import { berryArtwork } from "~/lib/sprites";
import { titleCase } from "~/lib/formatters";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { TypeCartridge } from "~/components/TypeCartridge";
import { ReadoutGrid } from "~/components/ReadoutGrid";
import { EntityPager } from "~/components/EntityPager";

export const Route = createFileRoute("/$lang/berry/$name")({
  loader: async ({ context, params }) => {
    if (!isLocale(params.lang)) throw notFound();
    try {
      await Promise.all([
        context.queryClient.ensureQueryData(berryBundleQuery(params.lang, params.name)),
        context.queryClient.ensureQueryData(berryIndexQuery(params.lang)),
      ]);
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
  const { data: index } = useSuspenseQuery(berryIndexQuery(lang));

  // PokéAPI flavor potency tops out at 40 in practice; cap at 40 for the bar.
  const FLAVOR_MAX = 40;

  return (
    <>
      <ConsoleDevice
        title={data.display_name}
        subtitle={`BERRY · ${data.firmness.toUpperCase()}`}
      >
        <div className="screen__hud">
          <div>
            <p className="hud-row"><b>BERRY</b>&nbsp;&nbsp;{data.name}</p>
            <h1 className="hud-name">{data.display_name}</h1>
            <p className="hud-genus">{data.item.display_name}</p>
            <div className="hud-sprite">
              <img
                src={berryArtwork(data.name)}
                alt={data.display_name}
                width={128}
                height={128}
                style={{ width: "55%", imageRendering: "pixelated" }}
              />
            </div>
            <ul className="cart-row pill-list" aria-label="Natural gift type">
              <li><TypeCartridge name={data.natural_gift_type} locale={lang} asLink /></li>
            </ul>
          </div>

          <div className="hud__column">
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

            <div className="hud-card">
              <div className="hud-card__title">
                <span>Flavors</span>
                <span>Potency</span>
              </div>
              <ul className="flavor-grid" aria-label="Flavor potencies">
                {data.flavors.map((f) => {
                  const pct = Math.min(100, (f.potency / FLAVOR_MAX) * 100);
                  return (
                    <li key={f.name} className="flavor-cell" data-flavor={f.name}>
                      <span className="flavor-cell__label">{titleCase(f.name)}</span>
                      <span className="flavor-cell__value">{f.potency}</span>
                      <span className="flavor-cell__bar" aria-hidden>
                        <span
                          className="flavor-cell__fill"
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </ConsoleDevice>

      <EntityPager
        locale={lang}
        entries={index.entries}
        currentSlug={data.slug}
        to="/$lang/berry/$name"
        labelText={data.display_name}
        iconResolver={(e) => berryArtwork(e.name ?? e.slug)}
      />
    </>
  );
}
