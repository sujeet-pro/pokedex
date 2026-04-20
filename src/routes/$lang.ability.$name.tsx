import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { abilityBundleQuery } from "~/lib/queries";
import { BundleError } from "~/lib/bundles";
import { padDex } from "~/lib/formatters";
import { ConsoleDevice } from "~/components/ConsoleDevice";

export const Route = createFileRoute("/$lang/ability/$name")({
  loader: async ({ context, params }) => {
    if (!isLocale(params.lang)) throw notFound();
    try {
      await context.queryClient.ensureQueryData(abilityBundleQuery(params.lang, params.name));
    } catch (err) {
      if (err instanceof BundleError && err.status === 404) throw notFound();
      throw err;
    }
  },
  component: AbilityDetailPage,
  head: ({ params }) => ({ meta: [{ title: `${params.name} · Ability · Pokédex` }] }),
});

const SPRITE_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

function AbilityDetailPage() {
  const { lang, name } = Route.useParams();
  if (!isLocale(lang)) return null;
  const { data } = useSuspenseQuery(abilityBundleQuery(lang, name));

  return (
    <>
      <ConsoleDevice
        title={data.display_name}
        subtitle={`ABILITY · ${data.generation.toUpperCase()}`}
      >
        <div className="hud__column">
          <p className="hud-row">
            <b>ABILITY</b>&nbsp;&nbsp;{data.name}
          </p>
          <h1 className="hud-name">{data.display_name}</h1>
          <p className="hud-genus">{data.generation}</p>

          {data.short_effect_html ? (
            <div className="hud-card">
              <div className="hud-card__title"><span>Short effect</span></div>
              <div dangerouslySetInnerHTML={{ __html: data.short_effect_html }} />
            </div>
          ) : null}

          {data.effect_html ? (
            <div className="hud-card">
              <div className="hud-card__title"><span>Effect</span></div>
              <div dangerouslySetInnerHTML={{ __html: data.effect_html }} />
            </div>
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
        <div className="panel__title">Pokémon · {data.pokemon.length}</div>
        <ul className="grid-cards" aria-label="Pokémon with this ability">
          {data.pokemon.map((p) => (
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
                {p.is_hidden ? (
                  <ul className="pokemon-card__types pill-list" aria-label="hidden">
                    <li><span className="pill">Hidden</span></li>
                  </ul>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
