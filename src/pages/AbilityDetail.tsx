import { Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { abilityQuery } from "~/api/queries";
import { abilityRoute } from "~/router";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { cleanFlavor, englishEntry, padId, titleCase } from "~/utils/formatters";

function idFromUrl(url: string): number {
  const m = url.match(/\/(\d+)\/?$/);
  return m ? Number(m[1]) : 0;
}

function AbilityContent({ name }: { name: string }) {
  const { data } = useSuspenseQuery(abilityQuery(name));
  const english = englishEntry(data.effect_entries);
  const flavor = englishEntry(data.flavor_text_entries);
  const displayName = englishEntry(data.names)?.name ?? titleCase(data.name);

  return (
    <>
      <div className="screen__hud" style={{ gridTemplateColumns: "1fr" }}>
        <div>
          <p className="hud-row">
            <b>ABILITY</b> · GEN {data.generation.name.replace("generation-", "").toUpperCase()} ·{" "}
            <b>POKÉMON</b> {data.pokemon.length}
          </p>
          <h1 className="hud-name">{displayName}</h1>
          {english && <div className="hud-genus">{english.short_effect}</div>}
        </div>

        {english && (
          <div className="hud-card">
            <div className="hud-card__title">
              <span>Effect</span>
            </div>
            <p
              style={{
                margin: 0,
                color: "var(--screen-fg-dim)",
                fontSize: "0.9rem",
                lineHeight: 1.6,
              }}
            >
              {english.effect}
            </p>
          </div>
        )}

        {flavor && (
          <div className="hud-card">
            <div className="hud-card__title">
              <span>Flavor</span>
            </div>
            <p className="hud-flavor" style={{ marginTop: 0 }}>
              {cleanFlavor(flavor.flavor_text)}
            </p>
          </div>
        )}

        <div className="hud-card">
          <div className="hud-card__title">
            <span>Holders</span>
            <span>{data.pokemon.length}</span>
          </div>
          <ul className="grid-cards">
            {data.pokemon.map((p) => {
              const id = idFromUrl(p.pokemon.url);
              return (
                <li key={p.pokemon.name}>
                  <Link
                    to="/pokemon/$name"
                    params={{ name: p.pokemon.name }}
                    className="pokemon-card"
                    aria-label={`${titleCase(p.pokemon.name)}, ${padId(id)}${p.is_hidden ? ", hidden ability" : ""}`}
                  >
                    <div className="pokemon-card__sprite">
                      <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`}
                        alt=""
                        width={450}
                        height={450}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
                        }}
                      />
                    </div>
                    <div className="pokemon-card__id">{padId(id)}</div>
                    <div className="pokemon-card__name">
                      {titleCase(p.pokemon.name)}
                      {p.is_hidden && (
                        <span
                          aria-hidden="true"
                          style={{
                            display: "block",
                            color: "var(--amber)",
                            fontSize: "0.7rem",
                            letterSpacing: "0.1em",
                            marginTop: "0.15rem",
                          }}
                        >
                          HIDDEN
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
}

function AbilityContentSkeleton({ urlName }: { urlName: string }) {
  return (
    <div className="screen__hud" style={{ gridTemplateColumns: "1fr" }} aria-busy="true">
      <div>
        <p className="hud-row">
          <b>ABILITY</b> · loading
        </p>
        <h1 className="hud-name" style={{ opacity: 0.6 }}>
          {titleCase(urlName)}
        </h1>
        <div className="hud-genus">&nbsp;</div>
      </div>
      <div className="hud-card">
        <div className="hud-card__title">
          <span>Effect</span>
        </div>
        <div className="skeleton" style={{ height: "4rem" }} />
      </div>
      <div className="hud-card">
        <div className="hud-card__title">
          <span>Holders</span>
          <span>—</span>
        </div>
        <div className="skeleton" style={{ height: "18rem" }} />
      </div>
    </div>
  );
}

export function AbilityDetailPage() {
  const { id } = abilityRoute.useParams();
  const display = titleCase(id);
  return (
    <ConsoleDevice
      title="POKÉ DEX · ABILITY"
      subtitle={display}
      ariaLabel={`Ability readout for ${display}`}
    >
      <Suspense fallback={<AbilityContentSkeleton urlName={id} />}>
        <AbilityContent name={id.toLowerCase()} />
      </Suspense>
    </ConsoleDevice>
  );
}
