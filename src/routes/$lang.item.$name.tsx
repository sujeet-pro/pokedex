import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { itemBundleQuery } from "~/lib/queries";
import { BundleError } from "~/lib/bundles";
import { padDex } from "~/lib/formatters";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { HudSprite } from "~/components/HudSprite";
import { DossierField } from "~/components/DossierField";

export const Route = createFileRoute("/$lang/item/$name")({
  loader: async ({ context, params }) => {
    if (!isLocale(params.lang)) throw notFound();
    try {
      await context.queryClient.ensureQueryData(itemBundleQuery(params.lang, params.name));
    } catch (err) {
      if (err instanceof BundleError && err.status === 404) throw notFound();
      throw err;
    }
  },
  component: ItemDetailPage,
  head: ({ params }) => ({ meta: [{ title: `${params.name} · Item · Pokédex` }] }),
});

const SPRITE_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

function ItemDetailPage() {
  const { lang, name } = Route.useParams();
  if (!isLocale(lang)) return null;
  const { data } = useSuspenseQuery(itemBundleQuery(lang, name));

  return (
    <>
      <ConsoleDevice
        title={data.display_name}
        subtitle={`ITEM · ${data.category_display.toUpperCase()}`}
      >
        <div className="screen__hud">
          <div>
            <HudSprite src={data.sprite} alt={data.display_name} priority />
          </div>
          <div className="hud__column">
            <p className="hud-row"><b>ITEM</b>&nbsp;&nbsp;{data.name}</p>
            <h1 className="hud-name">{data.display_name}</h1>
            <p className="hud-genus">{data.category_display}</p>

            {data.attributes.length > 0 ? (
              <ul className="pill-list" aria-label="Attributes">
                {data.attributes.map((a) => (
                  <li key={a}><span className="pill">{a}</span></li>
                ))}
              </ul>
            ) : null}

            <ul className="dossier-list">
              <li><DossierField term="Cost" value={`¥${data.cost}`} /></li>
              <li><DossierField term="Fling power" value={data.fling_power ?? "—"} /></li>
              <li><DossierField term="Fling effect" value={data.fling_effect ?? "—"} /></li>
            </ul>

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
        </div>
      </ConsoleDevice>

      {data.held_by.length > 0 ? (
        <div className="panel">
          <div className="panel__title">Held by · {data.held_by.length}</div>
          <ul className="grid-cards" aria-label="Pokémon that hold this item">
            {data.held_by.map((p) => (
              <li key={p.name}>
                <Link
                  to="/$lang/pokemon/$name"
                  params={{ lang, name: p.name }}
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
    </>
  );
}
