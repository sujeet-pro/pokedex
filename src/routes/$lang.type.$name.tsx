import { pokemonArtwork } from "~/lib/sprites";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { typeBundleQuery, typeIndexQuery } from "~/lib/queries";
import { BundleError } from "~/lib/bundles";
import { padDex } from "~/lib/formatters";
import { typeInfo } from "~/lib/typeInfo";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { TypeCartridge } from "~/components/TypeCartridge";
import { EntityPager } from "~/components/EntityPager";

export const Route = createFileRoute("/$lang/type/$name")({
  loader: async ({ context, params }) => {
    if (!isLocale(params.lang)) throw notFound();
    try {
      await Promise.all([
        context.queryClient.ensureQueryData(typeBundleQuery(params.lang, params.name)),
        context.queryClient.ensureQueryData(typeIndexQuery(params.lang)),
      ]);
    } catch (err) {
      if (err instanceof BundleError && err.status === 404) throw notFound();
      throw err;
    }
  },
  component: TypeDetailPage,
  head: ({ params }) => ({ meta: [{ title: `${params.name} type · Pokédex` }] }),
});


type TypeRef = { id: number; name: string; slug: string; display_name: string };

function TypeList({ title, refs, locale }: { title: string; refs: TypeRef[]; locale: string }) {
  if (refs.length === 0) return null;
  return (
    <div>
      <div className="hud-row">
        <b>{title}</b>
      </div>
      <ul className="pill-list" aria-label={title} style={{ marginTop: ".35rem" }}>
        {refs.map((r) => (
          <li key={r.name}>
            <TypeCartridge name={r.name} size="sm" locale={locale as never} asLink />
          </li>
        ))}
      </ul>
    </div>
  );
}

function TypeDetailPage() {
  const { lang, name } = Route.useParams();
  if (!isLocale(lang)) return null;
  const { data } = useSuspenseQuery(typeBundleQuery(lang, name));
  const { data: index } = useSuspenseQuery(typeIndexQuery(lang));
  const info = typeInfo(data.name);

  return (
    <>
      <ConsoleDevice
        title={data.display_name}
        subtitle={`TYPE · ${data.generation.toUpperCase()}`}
      >
        <div className="screen__hud">
          <div>
            <div className="hud-sprite" style={{ display: "grid", placeItems: "center" }}>
              <div
                style={{
                  width: "60%",
                  aspectRatio: "1",
                  borderRadius: "50%",
                  background: info.color,
                  border: "2px solid rgba(0,0,0,.4)",
                  display: "grid",
                  placeItems: "center",
                  color: info.textColor,
                  fontFamily: "var(--font-mono)",
                  fontWeight: 800,
                  fontSize: "2rem",
                  letterSpacing: ".1em",
                }}
                aria-hidden
              >
                {info.short}
              </div>
            </div>
          </div>
          <div className="hud__column">
            <p className="hud-row">
              <b>TYPE</b>&nbsp;&nbsp;{data.name}
            </p>
            <h1 className="hud-name">{data.display_name}</h1>
            <p className="hud-genus">#{padDex(data.id)} · {data.generation}</p>

            <div className="hud-card">
              <div className="hud-card__title">
                <span>Attacking</span>
              </div>
              <div style={{ display: "grid", gap: ".75rem" }}>
                <TypeList title="Super effective" refs={data.relations.double_damage_to} locale={lang} />
                <TypeList title="Not very effective" refs={data.relations.half_damage_to} locale={lang} />
                <TypeList title="No effect" refs={data.relations.no_damage_to} locale={lang} />
              </div>
            </div>

            <div className="hud-card">
              <div className="hud-card__title">
                <span>Defending</span>
              </div>
              <div style={{ display: "grid", gap: ".75rem" }}>
                <TypeList title="Weak to" refs={data.relations.double_damage_from} locale={lang} />
                <TypeList title="Resists" refs={data.relations.half_damage_from} locale={lang} />
                <TypeList title="Immune to" refs={data.relations.no_damage_from} locale={lang} />
              </div>
            </div>
          </div>
        </div>
      </ConsoleDevice>

      <div className="panel">
        <div className="panel__title">Pokémon of this type · {data.pokemon.length}</div>
        <ul className="grid-cards" aria-label={`${data.display_name} Pokémon`}>
          {data.pokemon.map((p) => (
            <li key={p.name}>
              <Link
                to="/$lang/pokemon/$name"
                params={{ lang, name: p.slug }}
                className="pokemon-card"
              >
                <div className="pokemon-card__sprite">
                  <img src={pokemonArtwork(p.id)} alt="" loading="lazy" width={96} height={96} />
                </div>
                <div className="pokemon-card__id">{padDex(p.id)}</div>
                <div className="pokemon-card__name">{p.display_name}</div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <EntityPager
        locale={lang}
        entries={index.entries}
        currentSlug={data.slug}
        to="/$lang/type/$name"
        labelText={data.display_name}
      />
    </>
  );
}
