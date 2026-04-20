import { Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { abilityBundleQuery, abilityIndexQuery } from "~/api/queries";
import { abilityRoute } from "~/router";
import { useAdjacentNav } from "~/hooks/useAdjacentNav";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { padId, titleCase } from "~/utils/formatters";

function AbilityContent({ name }: { name: string }) {
  const { data } = useSuspenseQuery(abilityBundleQuery(name));
  const { data: index } = useQuery(abilityIndexQuery());
  useAdjacentNav(index?.entries, data.name, "/ability");

  return (
    <div className="screen__hud" style={{ gridTemplateColumns: "1fr" }}>
      <div>
        <p className="hud-row">
          <b>ABILITY</b> · GEN {data.generation.replace("generation-", "").toUpperCase()} ·{" "}
          <b>POKÉMON</b> {data.pokemon.length}
        </p>
        <h1 className="hud-name">{data.display_name}</h1>
        {data.short_effect && <div className="hud-genus">{data.short_effect}</div>}
      </div>

      {data.effect && (
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
            {data.effect}
          </p>
        </div>
      )}

      {data.flavor && (
        <div className="hud-card">
          <div className="hud-card__title">
            <span>Flavor</span>
          </div>
          <p className="hud-flavor" style={{ marginTop: 0 }}>
            {data.flavor}
          </p>
        </div>
      )}

      <div className="hud-card">
        <div className="hud-card__title">
          <span>Holders</span>
          <span>{data.pokemon.length}</span>
        </div>
        <ul className="grid-cards">
          {data.pokemon.map((p) => (
            <li key={p.name}>
              <Link
                to="/pokemon/$name"
                params={{ name: p.name }}
                className="pokemon-card"
                aria-label={`${titleCase(p.name)}, ${padId(p.id)}${p.is_hidden ? ", hidden ability" : ""}`}
              >
                <div className="pokemon-card__sprite">
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`}
                    alt=""
                    width={450}
                    height={450}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`;
                    }}
                  />
                </div>
                <div className="pokemon-card__id">{padId(p.id)}</div>
                <div className="pokemon-card__name">
                  {titleCase(p.name)}
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
          ))}
        </ul>
      </div>
    </div>
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
  const { name } = abilityRoute.useParams();
  const display = titleCase(name);
  return (
    <ConsoleDevice
      title="POKÉ DEX · ABILITY"
      subtitle={display}
      ariaLabel={`Ability readout for ${display}`}
    >
      <Suspense fallback={<AbilityContentSkeleton urlName={name} />}>
        <AbilityContent name={name.toLowerCase()} />
      </Suspense>
    </ConsoleDevice>
  );
}
