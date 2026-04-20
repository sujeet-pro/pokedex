import { useMemo, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { makeT } from "~/i18n";
import { pokemonBundleQuery, pokemonIndexQuery } from "~/lib/queries";
import { padDex } from "~/lib/formatters";
import { pokemonArtwork } from "~/lib/sprites";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { HudSprite } from "~/components/HudSprite";
import { ReadoutGrid } from "~/components/ReadoutGrid";
import { TypeCartridge } from "~/components/TypeCartridge";
import { SpeakButton } from "~/components/SpeakButton";
import { pokemonNarrative } from "~/lib/narrative";

/** Simple FNV-1a hash → stable pseudo-random pick from a list. */
function pickFeaturedSlug(slugs: string[]): string {
  const today = new Date().toISOString().slice(0, 10);
  let hash = 2166136261;
  for (let i = 0; i < today.length; i++) {
    hash ^= today.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const index = Math.abs(hash) % slugs.length;
  return slugs[index]!;
}

export const Route = createFileRoute("/$lang/")({
  loader: async ({ context, params }) => {
    if (!isLocale(params.lang)) return;
    const index = await context.queryClient.ensureQueryData(
      pokemonIndexQuery(params.lang),
    );
    const slugs = index.entries.map((e) => e.slug);
    if (slugs.length > 0) {
      const featured = pickFeaturedSlug(slugs);
      await context.queryClient.ensureQueryData(
        pokemonBundleQuery(params.lang, featured),
      );
      return { featured };
    }
    return { featured: null as string | null };
  },
  component: LocaleHome,
});

function LocaleHome() {
  const { lang } = Route.useParams();
  const loaderData = Route.useLoaderData();
  const summaryRef = useRef<HTMLDivElement | null>(null);
  if (!isLocale(lang)) return null;
  const t = makeT(lang);

  const index = useSuspenseQuery(pokemonIndexQuery(lang));

  const featuredSlug = loaderData?.featured ?? null;

  if (!featuredSlug) {
    return (
      <div>
        <header className="hero-head">
          <h1 className="page-title">{t("app_title")}</h1>
          <p className="page-lede">{t("tagline")}</p>
        </header>
        <div className="nav-buttons">
          <Link to="/$lang/pokemon" params={{ lang }} className="hero-cta">
            {t("nav_pokemon")} · {index.data.total}
          </Link>
        </div>
      </div>
    );
  }

  return <FeaturedPokemon lang={lang} slug={featuredSlug} summaryRef={summaryRef} />;
}

function FeaturedPokemon({
  lang,
  slug,
  summaryRef,
}: {
  lang: "en" | "fr";
  slug: string;
  summaryRef: React.RefObject<HTMLDivElement | null>;
}) {
  const t = makeT(lang);
  const { data } = useSuspenseQuery(pokemonBundleQuery(lang, slug));

  const artwork = data.sprites.official_artwork ?? pokemonArtwork(data.id);
  const heightM = (data.height / 10).toFixed(1);
  const weightKg = (data.weight / 10).toFixed(1);
  const dexPad = padDex(data.id).replace("#", "");

  const subtitle = useMemo(() => `featured · ${dexPad}`, [dexPad]);

  return (
    <>
      <header className="hero-head">
        <h1 className="page-title">{t("app_title")}</h1>
        <p className="page-lede">{t("tagline")}</p>
      </header>

      <ConsoleDevice
        title="POKÉ DEX · DAILY"
        subtitle={subtitle}
        headerAction={
          <SpeakButton
            kind="pokemon"
            slug={data.slug}
            displayName={data.display_name}
            locale={lang}
            summaryHtml={data.summary_html}
            summaryContainerRef={summaryRef}
            narrativeBuilder={() => pokemonNarrative(data, lang)}
          />
        }
      >
        <div className="screen__hud">
          <div>
            <p className="hud-meta-row">
              <span><b>DEX</b>{dexPad}</span>
              <span><b>GEN</b>{data.species.generation.replace(/^generation-/, "").toUpperCase()}</span>
            </p>
            <h1 className="hud-name">{data.display_name}</h1>
            <p className="hud-genus">{data.species.genus || "—"}</p>
            <HudSprite src={artwork} alt={data.display_name} priority />
            <ul className="cart-row pill-list" aria-label={t("detail_types")}>
              {data.types.map((ty) => (
                <li key={ty.name}>
                  <TypeCartridge name={ty.name} locale={lang} asLink />
                </li>
              ))}
            </ul>
            {data.species.flavor_html ? (
              <p
                className="hud-flavor"
                dangerouslySetInnerHTML={{
                  __html: data.species.flavor_html
                    .replace(/^<p>/, "")
                    .replace(/<\/p>$/, ""),
                }}
              />
            ) : null}
          </div>

          <div className="hud__column">
            <div className="hud-card">
              <div className="hud-card__title"><span>Vitals</span></div>
              <ReadoutGrid
                items={[
                  { label: "Height", value: heightM, unit: "m" },
                  { label: "Weight", value: weightKg, unit: "kg" },
                  { label: "Base XP", value: data.base_experience },
                ]}
              />
            </div>

            <div className="nav-buttons" style={{ justifyContent: "flex-start" }}>
              <Link
                to="/$lang/pokemon/$name"
                params={{ lang, name: data.slug }}
                className="hero-cta"
              >
                {t("detail_cta")}
              </Link>
              <Link to="/$lang/pokemon" params={{ lang }} className="pill-button">
                {t("nav_pokemon")}
              </Link>
            </div>
          </div>
        </div>
      </ConsoleDevice>
    </>
  );
}
