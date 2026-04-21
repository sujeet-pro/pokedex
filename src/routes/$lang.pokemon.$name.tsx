import { useMemo, useRef } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { pokemonBundleQuery } from "~/lib/queries";
import { BundleError } from "~/lib/bundles";
import { makeT } from "~/i18n";
import { padDex } from "~/lib/formatters";
import { pokemonArtwork } from "~/lib/sprites";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { HudSprite } from "~/components/HudSprite";
import { ReadoutGrid } from "~/components/ReadoutGrid";
import { TypeCartridge } from "~/components/TypeCartridge";
import { StatRadar } from "~/components/StatRadar";
import { WeaknessGrid } from "~/components/WeaknessGrid";
import { EvolutionChain } from "~/components/EvolutionChain";
import { AbilityButton } from "~/components/AbilityButton";
import { DossierField } from "~/components/DossierField";
import { SpeakButton } from "~/components/SpeakButton";
import { SummaryPopover } from "~/components/SummaryPopover";
import { InlineSpeakButton } from "~/components/InlineSpeakButton";
import { PokemonSummary } from "~/components/PokemonSummary";
import { Pager } from "~/components/Pager";
import { pokemonNarrative } from "~/lib/narrative";
import { useRegisterEntity } from "~/hooks/useCurrentEntity";
import { useSummary } from "~/hooks/useSummary";

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
  head: ({ params }) => ({ meta: [{ title: `${params.name} · Pokédex` }] }),
});

function romanGeneration(slug: string): string {
  const part = slug.replace(/^generation-/, "").toUpperCase();
  return part.replaceAll("-", " ");
}

function rarityLabel(data: {
  is_legendary: boolean;
  is_mythical: boolean;
  is_baby: boolean;
}): string {
  if (data.is_mythical) return "Mythical";
  if (data.is_legendary) return "Legendary";
  if (data.is_baby) return "Baby";
  return "Standard";
}

function PokemonDetailPage() {
  const { lang, name } = Route.useParams();
  const summaryRef = useRef<HTMLDivElement | null>(null);
  if (!isLocale(lang)) return null;
  const t = makeT(lang);
  const { data } = useSuspenseQuery(pokemonBundleQuery(lang, name));

  useRegisterEntity(useMemo(() => ({ resource: "pokemon", slugs: data.slugs }), [data.slugs]));

  // Resolve the displayed summary: bundle-shipped HTML when available,
  // otherwise an on-device AI / friendly-fallback pass that we kick off
  // during an idle callback. The SpeakButton, SummaryPopover and the
  // entry-panel InlineSpeakButton all share this cache entry.
  const { html: resolvedSummaryHtml, source: summarySource } = useSummary({
    kind: "pokemon",
    slug: data.slug,
    locale: lang,
    bundleHtml: data.summary_html,
    narrativeBuilder: () => pokemonNarrative(data, lang),
  });

  const onDeviceLabel =
    lang === "es" ? "Resumen generado en el dispositivo" : "On-Device Summary Generation";

  const artwork = data.sprites.official_artwork ?? data.sprites.front_default;
  const heightM = (data.height / 10).toFixed(1);
  const weightKg = (data.weight / 10).toFixed(1);
  const dexPad = padDex(data.id).replace("#", "");
  const orderPad = data.order.toString().padStart(4, "0");

  return (
    <>
      <ConsoleDevice
        title="POKÉ DEX · SCANNER"
        subtitle={`read · ${data.id}`}
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
        <div className="screen__hud">
          <div>
            <p className="hud-meta-row" role="group" aria-label="Identifiers">
              <span>
                <b>DEX</b>
                {dexPad}
              </span>
              <span>
                <b>GEN</b>
                {romanGeneration(data.species.generation)}
              </span>
              <span>
                <b>ORD</b>
                {orderPad}
              </span>
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
              <p className="hud-flavor hud-flavor--with-speaker">
                <InlineSpeakButton
                  text={data.species.flavor_html}
                  locale={lang}
                  label={lang === "es" ? "Leer entrada" : "Play entry"}
                  stopLabel={lang === "es" ? "Detener" : "Stop"}
                  speakKey={`pokemon-${data.slug}:flavor`}
                />
                <span
                  dangerouslySetInnerHTML={{
                    __html: data.species.flavor_html.replace(/^<p>/, "").replace(/<\/p>$/, ""),
                  }}
                />
              </p>
            ) : null}
          </div>

          <div className="hud__column">
            <div className="hud-card">
              <div className="hud-card__title">
                <span>BASE STATS · HEX</span>
                <span>Σ {data.stats_total}</span>
              </div>
              <StatRadar stats={data.stats} locale={lang} />
            </div>

            <ReadoutGrid
              items={[
                { label: "Height", value: heightM, unit: "m" },
                { label: "Weight", value: weightKg, unit: "kg" },
                { label: "Base XP", value: data.base_experience },
              ]}
            />

            <ReadoutGrid
              items={[
                { label: "Catch", value: data.species.capture_rate, unit: "/255" },
                { label: "Happy", value: data.species.base_happiness },
                {
                  label: "Hatch",
                  value: data.species.hatch_counter ?? "—",
                  unit: data.species.hatch_counter != null ? "steps" : undefined,
                },
              ]}
            />

            {data.defenders.length > 0 ? (
              <div className="hud-card">
                <div className="hud-card__title">
                  <span>DAMAGE TAKEN · 18 TYPES</span>
                  <span>CLICK A CELL</span>
                </div>
                <WeaknessGrid defenders={data.defenders} locale={lang} />
              </div>
            ) : null}
          </div>
        </div>

        {data.evolution_chain ? (
          <div className="panel">
            <div className="panel__title">EVOLUTION</div>
            <EvolutionChain root={data.evolution_chain} locale={lang} currentSlug={data.slug} />
          </div>
        ) : (
          <p className="evo-empty">This Pokémon does not evolve.</p>
        )}

        <div className="two-column">
          <div className="panel">
            <div className="panel__title">
              <span>ABILITIES</span>
              <span>{data.abilities.length}</span>
            </div>
            <ul className="ability-list">
              {data.abilities.map((a) => (
                <li key={a.name}>
                  <AbilityButton ability={a} locale={lang} />
                </li>
              ))}
            </ul>
          </div>

          <div className="panel">
            <div className="panel__title">
              <span>DOSSIER</span>
              <span>META</span>
            </div>
            <ul className="dossier-list">
              <li>
                <DossierField term="Habitat" value={data.species.habitat_display ?? "Unknown"} />
              </li>
              <li>
                <DossierField term="Body shape" value={data.species.shape_display ?? "Unknown"} />
              </li>
              <li>
                <DossierField term="Colour" value={data.species.color_display} />
              </li>
              <li>
                <DossierField term="Growth rate" value={data.species.growth_rate_display} />
              </li>
              <li>
                <DossierField
                  term="Egg groups"
                  value={data.species.egg_groups_display.join(", ") || "No Eggs"}
                />
              </li>
              <li>
                <DossierField term="Rarity" value={rarityLabel(data.species)} />
              </li>
            </ul>
            <div className="dossier-tags">
              <span className="pill">SPECIES · {data.species.display_name}</span>
              {data.forms.length > 0 ? (
                <span className="pill">FORM · {data.forms[0]!.display_name}</span>
              ) : null}
            </div>
          </div>
        </div>

        {resolvedSummaryHtml ? (
          <div className="panel">
            <div className="panel__title panel__title--with-action">
              <span>{lang === "es" ? "ENTRADA" : "ENTRY"}</span>
              <InlineSpeakButton
                text={resolvedSummaryHtml}
                locale={lang}
                label={lang === "es" ? "Leer entrada" : "Play entry"}
                stopLabel={lang === "es" ? "Detener" : "Stop"}
                speakKey={`pokemon-${data.slug}`}
              />
            </div>
            {summarySource === "client" ? (
              <p className="summary-pop__source">{onDeviceLabel}</p>
            ) : null}
            <PokemonSummary ref={summaryRef} summaryHtml={resolvedSummaryHtml} />
          </div>
        ) : null}
      </ConsoleDevice>

      <Pager
        locale={lang}
        prev={
          data.pager.prev
            ? {
                ...data.pager.prev,
                iconSrc: pokemonArtwork(data.pager.prev.id),
                iconPixel: false,
              }
            : null
        }
        next={
          data.pager.next
            ? {
                ...data.pager.next,
                iconSrc: pokemonArtwork(data.pager.next.id),
                iconPixel: false,
              }
            : null
        }
        prevLabel={t("detail_pager_prev")}
        nextLabel={t("detail_pager_next")}
        prevName={
          data.pager.prev
            ? `#${padDex(data.pager.prev.id).replace("#", "")} · ${data.pager.prev.display_name ?? data.pager.prev.name}`
            : undefined
        }
        nextName={
          data.pager.next
            ? `#${padDex(data.pager.next.id).replace("#", "")} · ${data.pager.next.display_name ?? data.pager.next.name}`
            : undefined
        }
        labelText={`#${padDex(data.id).replace("#", "")} · ${data.display_name}`}
        to="/$lang/pokemon/$name"
      />
    </>
  );
}
