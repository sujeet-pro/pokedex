import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { generationBundleQuery } from "~/lib/queries";
import { BundleError } from "~/lib/bundles";
import { padDex } from "~/lib/formatters";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { TypeCartridge } from "~/components/TypeCartridge";
import { ReadoutGrid } from "~/components/ReadoutGrid";

export const Route = createFileRoute("/$lang/generation/$name")({
  loader: async ({ context, params }) => {
    if (!isLocale(params.lang)) throw notFound();
    try {
      await context.queryClient.ensureQueryData(generationBundleQuery(params.lang, params.name));
    } catch (err) {
      if (err instanceof BundleError && err.status === 404) throw notFound();
      throw err;
    }
  },
  component: GenerationDetailPage,
  head: ({ params }) => ({ meta: [{ title: `${params.name} · Generation · Pokédex` }] }),
});

const SPRITE_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

function GenerationDetailPage() {
  const { lang, name } = Route.useParams();
  if (!isLocale(lang)) return null;
  const { data } = useSuspenseQuery(generationBundleQuery(lang, name));

  return (
    <>
      <ConsoleDevice
        title={data.display_name}
        subtitle={`GENERATION · ${data.main_region.toUpperCase()}`}
      >
        <div className="hud__column">
          <p className="hud-row"><b>GEN</b>&nbsp;&nbsp;{data.name}</p>
          <h1 className="hud-name">{data.display_name}</h1>
          <p className="hud-genus">{data.main_region}</p>

          {data.version_groups.length > 0 ? (
            <ul className="pill-list" aria-label="Version groups">
              {data.version_groups.map((vg) => (
                <li key={vg}><span className="pill">{vg}</span></li>
              ))}
            </ul>
          ) : null}

          <div className="hud-card">
            <div className="hud-card__title"><span>Counts</span></div>
            <ReadoutGrid
              items={[
                { label: "Species", value: data.counts.species },
                { label: "Moves", value: data.counts.moves },
                { label: "Abilities", value: data.counts.abilities },
                { label: "Types", value: data.counts.types },
              ]}
            />
          </div>
        </div>
      </ConsoleDevice>

      {data.types.length > 0 ? (
        <div className="panel">
          <div className="panel__title">New types · {data.types.length}</div>
          <ul className="pill-list" aria-label="New types">
            {data.types.map((t) => (
              <li key={t.name}>
                <TypeCartridge name={t.name} locale={lang} asLink />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.abilities.length > 0 ? (
        <div className="panel">
          <div className="panel__title">New abilities · {data.abilities.length}</div>
          <ul className="pill-list" aria-label="New abilities">
            {data.abilities.map((a) => (
              <li key={a.name}>
                <Link
                  to="/$lang/ability/$name"
                  params={{ lang, name: a.slug }}
                  className="pill"
                >
                  {a.display_name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.species.length > 0 ? (
        <div className="panel">
          <div className="panel__title">New Pokémon · {data.species.length}</div>
          <ul className="grid-cards" aria-label="New Pokémon">
            {data.species.map((p) => (
              <li key={p.name}>
                <Link
                  to="/$lang/pokemon/$name"
                  params={{ lang, name: p.slug }}
                  className="pokemon-card"
                >
                  <div className="pokemon-card__sprite">
                    <img src={`${SPRITE_BASE}/${p.id}.png`} alt="" loading="lazy" width={96} height={96} />
                  </div>
                  <div className="pokemon-card__id">{padDex(p.id)}</div>
                  <div className="pokemon-card__name">{p.display_name}</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.moves.length > 0 ? (
        <div className="panel">
          <div className="panel__title">New moves · {data.moves.length}</div>
          <ul className="pill-list" aria-label="New moves">
            {data.moves.slice(0, 60).map((m) => (
              <li key={m.name}>
                <Link
                  to="/$lang/move/$name"
                  params={{ lang, name: m.slug }}
                  className="pill"
                >
                  {m.display_name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}
