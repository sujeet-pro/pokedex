import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { pokemonBundleQuery } from "~/lib/queries";
import { TypeCartridge } from "~/components/TypeCartridge";
import { makeT, type MessageKey } from "~/i18n";
import { padDex } from "~/lib/formatters";
import { BundleError } from "~/lib/bundles";

export const Route = createFileRoute("/$lang/pokemon/$name")({
  loader: async ({ context, params }) => {
    if (!isLocale(params.lang)) throw notFound();
    try {
      await context.queryClient.ensureQueryData(pokemonBundleQuery(params.lang, params.name));
    } catch (err) {
      if (err instanceof BundleError && err.status === 404) throw notFound();
      throw err;
    }
  },
  component: PokemonDetailPage,
  head: ({ params }) => ({
    meta: [{ title: `${params.name} — Pokédex` }],
  }),
});

const STAT_MAX = 255;

function PokemonDetailPage() {
  const { lang, name } = Route.useParams();
  if (!isLocale(lang)) return null;
  const t = makeT(lang);
  const { data } = useSuspenseQuery(pokemonBundleQuery(lang, name));

  const artwork = data.sprites.official_artwork ?? data.sprites.front_default;

  return (
    <article>
      <div className="detail-layout">
        <div className="detail-sprite">
          {artwork ? (
            <img src={artwork} alt={data.display_name} width={320} height={320} />
          ) : null}
        </div>
        <div>
          <div className="detail-dex">{padDex(data.id)}</div>
          <h1 className="detail-name">{data.display_name}</h1>
          <p style={{ color: "var(--text-muted)" }}>{data.species.genus}</p>

          <section className="detail-section">
            <h2>{t("detail_types")}</h2>
            <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
              {data.types.map((ty) => (
                <TypeCartridge key={ty.name} name={ty.name} />
              ))}
            </div>
          </section>

          <section className="detail-section">
            <h2>{t("detail_stats")}</h2>
            <div role="list">
              {data.stats.map((s) => {
                const key = `stat_${s.name}` as MessageKey;
                const label = t(key);
                const width = Math.min(100, (s.base_stat / STAT_MAX) * 100);
                return (
                  <div key={s.name} className="stat-row" role="listitem">
                    <span className="stat-row-label">{label}</span>
                    <span className="stat-row-bar">
                      <span className="stat-row-bar-fill" style={{ width: `${width}%` }} />
                    </span>
                    <span className="stat-row-value">{s.base_stat}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {data.abilities.length > 0 ? (
            <section className="detail-section">
              <h2>{t("detail_abilities")}</h2>
              <ul>
                {data.abilities.map((a) => (
                  <li key={a.name} style={{ marginBottom: ".25rem" }}>
                    <strong>{a.display_name}</strong>
                    {a.is_hidden ? <em style={{ color: "var(--text-muted)" }}> (hidden)</em> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {data.species.flavor_html ? (
            <section
              className="detail-section"
              dangerouslySetInnerHTML={{ __html: data.species.flavor_html }}
            />
          ) : null}
        </div>
      </div>

      <nav className="detail-pager" aria-label="Pager">
        {data.pager.prev ? (
          <Link
            to="/$lang/pokemon/$name"
            params={{ lang, name: data.pager.prev.name }}
            rel="prev"
          >
            ← {t("detail_pager_prev")}: {data.pager.prev.name}
          </Link>
        ) : (
          <span aria-disabled="true" />
        )}
        {data.pager.next ? (
          <Link
            to="/$lang/pokemon/$name"
            params={{ lang, name: data.pager.next.name }}
            rel="next"
          >
            {t("detail_pager_next")}: {data.pager.next.name} →
          </Link>
        ) : (
          <span aria-disabled="true" />
        )}
      </nav>
    </article>
  );
}
