import { useRef } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isLocale } from "~/types/locales";
import { pokemonBundleQuery } from "~/lib/queries";
import { BundleError } from "~/lib/bundles";
import { makeT } from "~/i18n";
import { padDex } from "~/lib/formatters";
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
import { PokemonSummary } from "~/components/PokemonSummary";
import { Pager } from "~/components/Pager";
import { pokemonNarrative } from "~/lib/narrative";

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

function PokemonDetailPage() {
  const { lang, name } = Route.useParams();
  const summaryRef = useRef<HTMLDivElement | null>(null);
  if (!isLocale(lang)) return null;
  const t = makeT(lang);
  const { data } = useSuspenseQuery(pokemonBundleQuery(lang, name));

  const artwork = data.sprites.official_artwork ?? data.sprites.front_default;
  const heightM = (data.height / 10).toFixed(1);
  const weightKg = (data.weight / 10).toFixed(1);

  return (
    <>
      <ConsoleDevice
        title={t("app_title")}
        subtitle={`No. ${padDex(data.id)} · ${data.species.generation.toUpperCase()}`}
        headerAction={
          <SpeakButton
            kind="pokemon"
            slug={data.name}
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
            <HudSprite src={artwork} alt={data.display_name} priority />
          </div>
          <div className="hud__column">
            <p className="hud-row">
              <b>DEX</b>&nbsp;&nbsp;{padDex(data.id)}
            </p>
            <h1 className="hud-name">{data.display_name}</h1>
            <p className="hud-genus">{data.species.genus || "—"}</p>

            <ul className="cart-row pill-list" aria-label={t("detail_types")}>
              {data.types.map((ty) => (
                <li key={ty.name}>
                  <TypeCartridge name={ty.name} locale={lang} asLink />
                </li>
              ))}
            </ul>

            <div className="hud-card">
              <div className="hud-card__title">
                <span>Vitals</span>
              </div>
              <ReadoutGrid
                items={[
                  { label: "Height", value: heightM, unit: "m" },
                  { label: "Weight", value: weightKg, unit: "kg" },
                  { label: "BaseEXP", value: data.base_experience },
                ]}
              />
            </div>

            {data.species.flavor_html ? (
              <p
                className="hud-flavor"
                dangerouslySetInnerHTML={{
                  __html: data.species.flavor_html.replace(/^<p>/, "").replace(/<\/p>$/, ""),
                }}
              />
            ) : null}
          </div>
        </div>
      </ConsoleDevice>

      <div className="panel">
        <div className="panel__title">{t("detail_stats")}</div>
        <StatRadar stats={data.stats} locale={lang} />
      </div>

      {data.abilities.length > 0 ? (
        <div className="panel">
          <div className="panel__title">{t("detail_abilities")}</div>
          <ul className="ability-list">
            {data.abilities.map((a) => (
              <li key={a.name}>
                <AbilityButton ability={a} locale={lang} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.defenders.length > 0 ? (
        <div className="panel">
          <div className="panel__title">Weaknesses</div>
          <WeaknessGrid defenders={data.defenders} />
        </div>
      ) : null}

      {data.evolution_chain ? (
        <div className="panel">
          <div className="panel__title">Evolution</div>
          <EvolutionChain root={data.evolution_chain} locale={lang} currentSlug={data.name} />
        </div>
      ) : null}

      <div className="panel">
        <div className="panel__title">Dossier</div>
        <ul className="dossier-list">
          <li>
            <DossierField term="Generation" value={data.species.generation} />
          </li>
          <li>
            <DossierField term="Capture rate" value={data.species.capture_rate} />
          </li>
          <li>
            <DossierField term="Base happiness" value={data.species.base_happiness} />
          </li>
          <li>
            <DossierField term="Hatch counter" value={data.species.hatch_counter ?? "—"} />
          </li>
          <li>
            <DossierField term="Habitat" value={data.species.habitat ?? "—"} />
          </li>
          <li>
            <DossierField term="Shape" value={data.species.shape ?? "—"} />
          </li>
          <li>
            <DossierField term="Color" value={data.species.color} />
          </li>
          <li>
            <DossierField term="Growth rate" value={data.species.growth_rate} />
          </li>
          <li>
            <DossierField term="Egg groups" value={data.species.egg_groups.join(", ") || "—"} />
          </li>
          {data.species.is_legendary ? (
            <li><DossierField term="Rarity" value="Legendary" /></li>
          ) : null}
          {data.species.is_mythical ? (
            <li><DossierField term="Rarity" value="Mythical" /></li>
          ) : null}
          {data.species.is_baby ? (
            <li><DossierField term="Rarity" value="Baby" /></li>
          ) : null}
        </ul>
      </div>

      {data.summary_html ? (
        <div className="panel">
          <div className="panel__title">Entry</div>
          <PokemonSummary ref={summaryRef} summaryHtml={data.summary_html} />
        </div>
      ) : null}

      <div className="nav-buttons" style={{ marginTop: "2rem" }}>
        <Pager
          locale={lang}
          prev={data.pager.prev}
          next={data.pager.next}
          prevLabel={t("detail_pager_prev")}
          nextLabel={t("detail_pager_next")}
          labelText={data.display_name}
          to="/$lang/pokemon/$name"
        />
      </div>
    </>
  );
}
