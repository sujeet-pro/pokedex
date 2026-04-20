import { Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { typeBundleQuery, typeIndexQuery } from "~/api/queries";
import { useAdjacentNav } from "~/hooks/useAdjacentNav";
import { typeRoute } from "~/router";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { TypeCartridge } from "~/components/TypeCartridge";
import { typeInfo } from "~/utils/typeInfo";
import { padId, titleCase } from "~/utils/formatters";

function RelationBlock({ label, list }: { label: string; list: string[] }) {
  return (
    <div className="hud-card">
      <div className="hud-card__title">
        <span>{label}</span>
        <span>{list.length}</span>
      </div>
      {list.length === 0 ? (
        <p
          style={{
            margin: 0,
            color: "var(--phosphor-dim)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontSize: "0.8rem",
          }}
        >
          &gt; None
        </p>
      ) : (
        <div className="cart-row" style={{ marginTop: 0 }}>
          {list.map((name) => (
            <TypeCartridge key={name} name={name} size="sm" />
          ))}
        </div>
      )}
    </div>
  );
}

function TypeContent({ name }: { name: string }) {
  const { data } = useSuspenseQuery(typeBundleQuery(name));
  const { data: index } = useQuery(typeIndexQuery());
  useAdjacentNav(index?.entries, data.name, "/type");
  const r = data.relations;
  const info = typeInfo(data.name);

  return (
    <div className="screen__hud" style={{ gridTemplateColumns: "1fr" }}>
      <div>
        <p className="hud-row">
          <b>TYPE</b> · GEN {titleCase(data.generation.replace("generation-", "")).toUpperCase()}
        </p>
        <h1 className="hud-name">{info.display}</h1>
        <div className="hud-genus">{info.description}</div>
        <div className="cart-row">
          <TypeCartridge name={data.name} asLink={false} />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "0.75rem",
        }}
      >
        <RelationBlock label="Deals ×2 to" list={r.double_damage_to} />
        <RelationBlock label="Deals ×½ to" list={r.half_damage_to} />
        <RelationBlock label="Deals ×0 to" list={r.no_damage_to} />
        <RelationBlock label="Takes ×2 from" list={r.double_damage_from} />
        <RelationBlock label="Takes ×½ from" list={r.half_damage_from} />
        <RelationBlock label="Takes ×0 from" list={r.no_damage_from} />
      </div>

      <div className="hud-card">
        <div className="hud-card__title">
          <span>Pokémon of this type</span>
          <span>
            {Math.min(60, data.pokemon.length)} / {data.pokemon.length}
          </span>
        </div>
        <ul className="grid-cards">
          {data.pokemon.slice(0, 60).map((p) => (
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
      </div>
    </div>
  );
}

function TypeContentSkeleton({ urlName }: { urlName: string }) {
  const info = typeInfo(urlName);
  return (
    <div className="screen__hud" style={{ gridTemplateColumns: "1fr" }} aria-busy="true">
      <div>
        <p className="hud-row">
          <b>TYPE</b> · loading
        </p>
        <h1 className="hud-name" style={{ opacity: 0.6 }}>
          {info.display}
        </h1>
        <div className="skeleton" style={{ height: "2rem", marginTop: "0.75rem" }} />
      </div>
      <div className="skeleton" style={{ height: "10rem" }} />
      <div className="hud-card">
        <div className="hud-card__title">
          <span>Pokémon of this type</span>
          <span>—</span>
        </div>
        <div className="skeleton" style={{ height: "18rem" }} />
      </div>
    </div>
  );
}

export function TypeDetailPage() {
  const { name } = typeRoute.useParams();
  const info = typeInfo(name);
  return (
    <ConsoleDevice
      title="POKÉ DEX · TYPE"
      subtitle={info.display}
      ariaLabel={`${info.display} type readout`}
    >
      <Suspense fallback={<TypeContentSkeleton urlName={name} />}>
        <TypeContent name={name.toLowerCase()} />
      </Suspense>
    </ConsoleDevice>
  );
}
