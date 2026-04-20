import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { speciesBundleQuery } from "~/lib/queries";
import { BundleError } from "~/lib/bundles";
import { padDex } from "~/lib/formatters";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { DossierField } from "~/components/DossierField";

export const Route = createFileRoute("/$lang/pokemon-species/$name")({
  loader: async ({ context, params }) => {
    if (!isLocale(params.lang)) throw notFound();
    try {
      await context.queryClient.ensureQueryData(speciesBundleQuery(params.lang, params.name));
    } catch (err) {
      if (err instanceof BundleError && err.status === 404) throw notFound();
      throw err;
    }
  },
  component: SpeciesDetailPage,
  head: ({ params }) => ({ meta: [{ title: `${params.name} · Species · Pokédex` }] }),
});

function SpeciesDetailPage() {
  const { lang, name } = Route.useParams();
  if (!isLocale(lang)) return null;
  const { data } = useSuspenseQuery(speciesBundleQuery(lang, name));

  const flags: string[] = [];
  if (data.is_legendary) flags.push("Legendary");
  if (data.is_mythical) flags.push("Mythical");
  if (data.is_baby) flags.push("Baby");

  return (
    <>
      <ConsoleDevice
        title={data.display_name}
        subtitle={`SPECIES · ${padDex(data.id)}`}
      >
        <div className="hud__column">
          <p className="hud-row">
            <b>SPECIES</b>&nbsp;&nbsp;{data.name}
          </p>
          <h1 className="hud-name">{data.display_name}</h1>
          <p className="hud-genus">{data.genus || "—"}</p>

          {flags.length > 0 ? (
            <ul className="pill-list" aria-label="Rarity">
              {flags.map((f) => (
                <li key={f}>
                  <span className="pill">{f}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {data.flavor_html ? (
            <p
              className="hud-flavor"
              dangerouslySetInnerHTML={{
                __html: data.flavor_html.replace(/^<p>/, "").replace(/<\/p>$/, ""),
              }}
            />
          ) : null}
        </div>
      </ConsoleDevice>

      <div className="panel">
        <div className="panel__title">Dossier</div>
        <ul className="dossier-list">
          <li><DossierField term="Generation" value={data.generation} /></li>
          <li><DossierField term="Color" value={data.color} /></li>
          <li><DossierField term="Shape" value={data.shape ?? "—"} /></li>
          <li><DossierField term="Habitat" value={data.habitat ?? "—"} /></li>
          <li><DossierField term="Growth rate" value={data.growth_rate} /></li>
          <li><DossierField term="Capture rate" value={data.capture_rate} /></li>
          <li><DossierField term="Base happiness" value={data.base_happiness} /></li>
          <li><DossierField term="Hatch counter" value={data.hatch_counter ?? "—"} /></li>
          <li>
            <DossierField
              term="Egg groups"
              value={data.egg_groups.join(", ") || "—"}
            />
          </li>
        </ul>
      </div>

      {data.varieties.length > 0 ? (
        <div className="panel">
          <div className="panel__title">Varieties</div>
          <ul className="pill-list" aria-label="Varieties">
            {data.varieties.map((v) => (
              <li key={v.name}>
                <Link
                  to="/$lang/pokemon/$name"
                  params={{ lang, name: v.slug }}
                  className="pill"
                >
                  {v.display_name}
                  {v.is_default ? " · default" : ""}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}
