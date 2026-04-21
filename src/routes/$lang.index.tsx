import { useMemo, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { makeT, type MessageKey } from "~/i18n";
import {
  pokemonBundleQuery,
  pokemonIndexQuery,
  typeIndexQuery,
} from "~/lib/queries";
import type { PokemonIndexEntry, TypeIndexEntry } from "~/types/bundles";
import { padDex } from "~/lib/formatters";
import { pokemonArtwork } from "~/lib/sprites";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { HudSprite } from "~/components/HudSprite";
import { TypeCartridge } from "~/components/TypeCartridge";
import { SpeakButton } from "~/components/SpeakButton";
import { SummaryPopover } from "~/components/SummaryPopover";
import { pokemonNarrative } from "~/lib/narrative";
import { typeInfo } from "~/lib/typeInfo";

/** FNV-1a hash — stable pseudo-random index into a list for a given key. */
function hashIndex(key: string, mod: number): number {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % mod;
}

const TODAY = () => new Date().toISOString().slice(0, 10);

function pickFeaturedSlug(slugs: string[]): string {
  return slugs[hashIndex(TODAY(), slugs.length)]!;
}

/** Canonical 18 main types (order matches the traditional Pokédex layout). */
const MAIN_TYPES: string[] = [
  "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy",
];

export const Route = createFileRoute("/$lang/")({
  loader: async ({ context, params }) => {
    if (!isLocale(params.lang)) return;
    const [index] = await Promise.all([
      context.queryClient.ensureQueryData(pokemonIndexQuery(params.lang)),
      context.queryClient.ensureQueryData(typeIndexQuery(params.lang)),
    ]);
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

  const index = useSuspenseQuery(pokemonIndexQuery(lang));
  const typeIndex = useSuspenseQuery(typeIndexQuery(lang));
  const featuredSlug = loaderData?.featured ?? null;

  return (
    <>
      {featuredSlug ? (
        <FeaturedPokemon lang={lang} slug={featuredSlug} summaryRef={summaryRef} />
      ) : null}

      <HomeBrowse lang={lang} />
      <HomeTypeShowcase
        lang={lang}
        pokemon={index.data.entries}
        types={typeIndex.data.entries}
      />
    </>
  );
}

function FeaturedPokemon({
  lang,
  slug,
  summaryRef,
}: {
  lang: "en" | "es";
  slug: string;
  summaryRef: React.RefObject<HTMLDivElement | null>;
}) {
  const t = makeT(lang);
  const { data } = useSuspenseQuery(pokemonBundleQuery(lang, slug));

  const artwork = data.sprites.official_artwork ?? pokemonArtwork(data.id);
  const heightM = (data.height / 10).toFixed(1);
  const weightKg = (data.weight / 10).toFixed(1);
  const dexPad = padDex(data.id).replace("#", "");
  const generation = data.species.generation.replace(/^generation-/, "").toUpperCase();

  const subtitle = useMemo(() => `featured · ${dexPad}`, [dexPad]);

  return (
    <ConsoleDevice
      title="POKÉ DEX · DAILY"
      subtitle={subtitle}
      headerAction={
        <>
          <SummaryPopover
            kind="pokemon"
            slug={data.slug}
            displayName={data.display_name}
            locale={lang}
            bundleHtml={data.summary_html}
            narrativeBuilder={() => pokemonNarrative(data, lang)}
          />
          <SpeakButton
            kind="pokemon"
            slug={data.slug}
            displayName={data.display_name}
            locale={lang}
            bundleHtml={data.summary_html}
            summaryContainerRef={summaryRef}
            narrativeBuilder={() => pokemonNarrative(data, lang)}
          />
        </>
      }
    >
      <div className="featured-card">
        <p className="hud-meta-row featured-card__meta">
          <span><b>DEX</b>{dexPad}</span>
          <span><b>GEN</b>{generation}</span>
        </p>
        <h1 className="hud-name featured-card__name">{data.display_name}</h1>
        {data.species.genus ? (
          <p className="hud-genus featured-card__genus">{data.species.genus}</p>
        ) : null}

        <div className="featured-card__sprite">
          <HudSprite src={artwork} alt={data.display_name} priority />
        </div>

        <ul className="cart-row pill-list featured-card__types" aria-label={t("detail_types")}>
          {data.types.map((ty) => (
            <li key={ty.name}>
              <TypeCartridge name={ty.name} locale={lang} asLink />
            </li>
          ))}
        </ul>

        <dl className="featured-card__vitals" aria-label="Vitals">
          <div>
            <dt>Height</dt>
            <dd>{heightM}<small> m</small></dd>
          </div>
          <div>
            <dt>Weight</dt>
            <dd>{weightKg}<small> kg</small></dd>
          </div>
          <div>
            <dt>Base XP</dt>
            <dd>{data.base_experience}</dd>
          </div>
        </dl>

        {data.species.flavor_html ? (
          <p
            className="hud-flavor featured-card__flavor"
            dangerouslySetInnerHTML={{
              __html: data.species.flavor_html
                .replace(/^<p>/, "")
                .replace(/<\/p>$/, ""),
            }}
          />
        ) : null}

        <Link
          to="/$lang/pokemon/$name"
          params={{ lang, name: data.slug }}
          className="featured-card__link"
        >
          {t("detail_cta")} →
        </Link>
      </div>
    </ConsoleDevice>
  );
}

type BrowseItem =
  | { kind: "typed"; key: MessageKey; to: "/$lang/pokemon"; icon: string }
  | { kind: "path"; key: MessageKey; path: string; icon: string };

const BROWSE_ITEMS: BrowseItem[] = [
  { kind: "typed", key: "nav_pokemon", to: "/$lang/pokemon", icon: "◉" },
  { kind: "path", key: "nav_types", path: "types", icon: "◈" },
  { kind: "path", key: "nav_abilities", path: "abilities", icon: "✦" },
  { kind: "path", key: "nav_moves", path: "moves", icon: "⚔" },
  { kind: "path", key: "nav_berries", path: "berries", icon: "◐" },
  { kind: "path", key: "nav_items", path: "items", icon: "▣" },
  { kind: "path", key: "nav_generations", path: "generations", icon: "§" },
  { kind: "path", key: "nav_locations", path: "locations", icon: "◭" },
];

function HomeBrowse({ lang }: { lang: "en" | "es" }) {
  const t = makeT(lang);
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL.slice(0, -1)
    : import.meta.env.BASE_URL;
  return (
    <section className="home-section" aria-labelledby="home-browse-heading">
      <h2 id="home-browse-heading" className="home-section__title">
        {t("home_browse_heading")}
      </h2>
      <ul className="home-browse-grid">
        {BROWSE_ITEMS.map((item) => {
          const label = t(item.key);
          const body = (
            <>
              <span className="home-browse-tile__icon" aria-hidden>{item.icon}</span>
              <span className="home-browse-tile__label">{label}</span>
            </>
          );
          return (
            <li key={item.key}>
              {item.kind === "typed" ? (
                <Link
                  to={item.to}
                  params={{ lang }}
                  className="home-browse-tile"
                >
                  {body}
                </Link>
              ) : (
                <a className="home-browse-tile" href={`${base}/${lang}/${item.path}`}>
                  {body}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function HomeTypeShowcase({
  lang,
  pokemon,
  types,
}: {
  lang: "en" | "es";
  pokemon: PokemonIndexEntry[];
  types: TypeIndexEntry[];
}) {
  const t = makeT(lang);
  const today = TODAY();

  const entries = useMemo(() => {
    // Keep only the traditional 18 types; preserve their canonical order.
    const byName = new Map(types.map((ty) => [ty.name, ty]));
    const byType = new Map<string, PokemonIndexEntry[]>();
    for (const p of pokemon) {
      for (const ty of p.types) {
        if (!byType.has(ty)) byType.set(ty, []);
        byType.get(ty)!.push(p);
      }
    }
    return MAIN_TYPES.flatMap((name) => {
      const ty = byName.get(name);
      const list = byType.get(name) ?? [];
      if (!ty || list.length === 0) return [];
      const pick = list[hashIndex(`${today}:${name}`, list.length)]!;
      return [{ type: ty, featured: pick, count: list.length }];
    });
  }, [pokemon, types, today]);

  if (entries.length === 0) return null;

  return (
    <section className="home-section" aria-labelledby="home-types-heading">
      <h2 id="home-types-heading" className="home-section__title">
        {t("home_types_heading")}
      </h2>
      <ul className="home-type-grid">
        {entries.map(({ type, featured, count }) => {
          const info = typeInfo(type.name);
          return (
            <li key={type.name}>
              <Link
                to="/$lang/type/$name"
                params={{ lang, name: type.slug }}
                className="home-type-card"
                style={{ ["--type-color" as string]: info.color }}
              >
                <div className="home-type-card__head">
                  <span className="home-type-card__name">{type.display_name}</span>
                  <span className="home-type-card__count">{count}</span>
                </div>
                <div className="home-type-card__body">
                  <div className="home-type-card__sprite">
                    <img
                      src={pokemonArtwork(featured.id)}
                      alt=""
                      loading="lazy"
                      width={72}
                      height={72}
                    />
                  </div>
                  <div>
                    <div className="home-type-card__featured">{featured.display_name}</div>
                    <div className="home-type-card__hint">#{padDex(featured.id).replace("#", "")} · {t("home_types_cta")} →</div>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
