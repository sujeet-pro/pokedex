import { Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { moveBundleQuery, moveIndexQuery } from "~/api/queries";
import { useAdjacentNav } from "~/hooks/useAdjacentNav";
import { moveRoute } from "~/router";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { DossierField } from "~/components/DossierField";
import { SpeakButton } from "~/components/SpeakButton";
import { TypeCartridge } from "~/components/TypeCartridge";
import { padId, titleCase } from "~/utils/formatters";

function MoveContent({ name }: { name: string }) {
  const { data } = useSuspenseQuery(moveBundleQuery(name));
  const { data: index } = useQuery(moveIndexQuery());
  useAdjacentNav(index?.entries, data.name, "/move");

  return (
    <>
      <div className="screen__hud">
        <div>
          <p className="hud-row">
            <b>MOVE</b> · GEN {data.generation.replace("generation-", "").toUpperCase()} ·{" "}
            <b>{titleCase(data.damage_class).toUpperCase()}</b>
          </p>
          <h1 className="hud-name">{data.display_name}</h1>
          {data.short_effect && <div className="hud-genus">{data.short_effect}</div>}
          <div className="cart-row">
            <TypeCartridge name={data.type} />
          </div>
          {data.flavor && <p className="hud-flavor">{data.flavor}</p>}
        </div>

        <div className="hud__column">
          <dl className="readouts">
            <div>
              <dt>Power</dt>
              <dd className="mono">{data.power ?? "—"}</dd>
            </div>
            <div>
              <dt>Accuracy</dt>
              <dd className="mono">{data.accuracy !== null ? `${data.accuracy}%` : "—"}</dd>
            </div>
            <div>
              <dt>PP</dt>
              <dd className="mono">{data.pp ?? "—"}</dd>
            </div>
            <div>
              <dt>Priority</dt>
              <dd className="mono">{data.priority}</dd>
            </div>
            <div>
              <dt>Target</dt>
              <dd>{titleCase(data.target)}</dd>
            </div>
            {data.effect_chance !== null && (
              <div>
                <dt>Eff. chance</dt>
                <dd className="mono">{data.effect_chance}%</dd>
              </div>
            )}
          </dl>

          {data.effect && data.effect !== data.short_effect && (
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
                  whiteSpace: "pre-wrap",
                }}
              >
                {data.effect}
              </p>
            </div>
          )}

          <div className="hud-card">
            <div className="hud-card__title">
              <span>Dossier</span>
            </div>
            <ul className="dossier-list">
              <li>
                <DossierField termKey="type" value={titleCase(data.type)} />
              </li>
              <li>
                <DossierField termKey="damage-class" value={titleCase(data.damage_class)} />
              </li>
              <li>
                <DossierField
                  termKey="generation"
                  value={titleCase(data.generation.replace("generation-", ""))}
                />
              </li>
            </ul>
          </div>
        </div>
      </div>

      {data.learned_by_pokemon.length > 0 && (
        <div className="hud-card" style={{ marginTop: "1rem" }}>
          <div className="hud-card__title">
            <span>Learned by</span>
            <span>{data.learned_by_pokemon.length}</span>
          </div>
          <ul className="grid-cards">
            {data.learned_by_pokemon.slice(0, 60).map((p) => (
              <li key={p.name}>
                <Link
                  to="/pokemon/$name"
                  params={{ name: p.name }}
                  className="pokemon-card"
                  aria-label={`${titleCase(p.name)}, ${padId(p.id)}`}
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
                  <div className="pokemon-card__name">{titleCase(p.name)}</div>
                </Link>
              </li>
            ))}
          </ul>
          {data.learned_by_pokemon.length > 60 && (
            <p
              style={{
                margin: "0.5rem 0 0",
                color: "var(--phosphor-dim)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.8rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              &gt; {data.learned_by_pokemon.length - 60} more…
            </p>
          )}
        </div>
      )}
    </>
  );
}

export function MoveDetailPage() {
  const { name } = moveRoute.useParams();
  const display = titleCase(name);
  return (
    <ConsoleDevice
      title="POKÉ DEX · MOVE"
      subtitle={display}
      ariaLabel={`Move: ${display}`}
      headerAction={<SpeakButton kind="move" name={name.toLowerCase()} displayName={display} />}
    >
      <Suspense fallback={<div className="skeleton" style={{ height: "18rem" }} />}>
        <MoveContent name={name.toLowerCase()} />
      </Suspense>
    </ConsoleDevice>
  );
}
