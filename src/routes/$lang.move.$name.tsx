import { pokemonArtwork } from "~/lib/sprites";
import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { moveBundleQuery } from "~/lib/queries";
import { BundleError } from "~/lib/bundles";
import { padDex } from "~/lib/formatters";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { TypeCartridge } from "~/components/TypeCartridge";
import { DossierField } from "~/components/DossierField";

export const Route = createFileRoute("/$lang/move/$name")({
  loader: async ({ context, params }) => {
    if (!isLocale(params.lang)) throw notFound();
    try {
      await context.queryClient.ensureQueryData(moveBundleQuery(params.lang, params.name));
    } catch (err) {
      if (err instanceof BundleError && err.status === 404) throw notFound();
      throw err;
    }
  },
  component: MoveDetailPage,
  head: ({ params }) => ({ meta: [{ title: `${params.name} · Move · Pokédex` }] }),
});

const PAGE_SIZE = 60;

function MoveDetailPage() {
  const { lang, name } = Route.useParams();
  if (!isLocale(lang)) return null;
  const { data } = useSuspenseQuery(moveBundleQuery(lang, name));
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(data.learned_by.length / PAGE_SIZE));
  const start = page * PAGE_SIZE;
  const pageEntries = data.learned_by.slice(start, start + PAGE_SIZE);

  return (
    <>
      <ConsoleDevice
        title={data.display_name}
        subtitle={`MOVE · ${data.generation.toUpperCase()}`}
      >
        <div className="hud__column">
          <p className="hud-row"><b>MOVE</b>&nbsp;&nbsp;{data.name}</p>
          <h1 className="hud-name">{data.display_name}</h1>
          <p className="hud-genus">{data.damage_class} · {data.target}</p>

          <ul className="cart-row pill-list" aria-label="Type">
            <li><TypeCartridge name={data.type} locale={lang} asLink /></li>
          </ul>

          <ul className="dossier-list">
            <li><DossierField term="Power" value={data.power ?? "—"} /></li>
            <li><DossierField term="Accuracy" value={data.accuracy ?? "—"} /></li>
            <li><DossierField term="PP" value={data.pp ?? "—"} /></li>
            <li><DossierField term="Priority" value={data.priority} /></li>
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
      </ConsoleDevice>

      {data.learned_by.length > 0 ? (
        <div className="panel">
          <div className="panel__title">
            Learned by · {data.learned_by.length}
            {totalPages > 1 ? (
              <span style={{ marginLeft: ".75rem" }}>
                Page {page + 1} / {totalPages}
              </span>
            ) : null}
          </div>
          <ul className="grid-cards" aria-label="Pokémon that learn this move">
            {pageEntries.map((p) => (
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
          {totalPages > 1 ? (
            <div className="nav-buttons">
              <button
                type="button"
                className="pill-button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                ← Prev
              </button>
              <button
                type="button"
                className="pill-button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                Next →
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
