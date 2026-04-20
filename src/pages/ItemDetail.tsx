import { Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { itemBundleQuery, itemIndexQuery } from "~/api/queries";
import { useAdjacentNav } from "~/hooks/useAdjacentNav";
import { itemRoute } from "~/router";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { DossierField } from "~/components/DossierField";
import { SpeakButton } from "~/components/SpeakButton";
import { titleCase } from "~/utils/formatters";

function ItemContent({ name }: { name: string }) {
  const { data } = useSuspenseQuery(itemBundleQuery(name));
  const { data: index } = useQuery(itemIndexQuery());
  useAdjacentNav(index?.entries, data.name, "/item");

  return (
    <>
      <div className="screen__hud">
        <div>
          <p className="hud-row">
            <b>ITEM</b> · {titleCase(data.category)}
            {data.cost > 0 && ` · ₽${data.cost}`}
          </p>
          <h1 className="hud-name">{data.display_name}</h1>
          {data.short_effect && <div className="hud-genus">{data.short_effect}</div>}
          {data.sprite && (
            <div className="hud-sprite" style={{ padding: "2rem" }}>
              <img
                src={data.sprite}
                alt={`${data.display_name} sprite`}
                style={{ width: "60%", imageRendering: "pixelated" }}
              />
            </div>
          )}
          {data.flavor && <p className="hud-flavor">{data.flavor}</p>}
        </div>

        <div className="hud__column">
          <div className="hud-card">
            <div className="hud-card__title">
              <span>Dossier</span>
              <span>meta</span>
            </div>
            <ul className="dossier-list">
              <li>
                <DossierField termKey="category" value={titleCase(data.category)} />
              </li>
              <li>
                <DossierField
                  termKey="cost"
                  value={data.cost > 0 ? `₽${data.cost}` : "—"}
                  valueText={data.cost > 0 ? `${data.cost} Poké dollars` : "not for sale"}
                />
              </li>
              {data.fling_power !== null && (
                <li>
                  <DossierField termKey="fling-power" value={String(data.fling_power)} />
                </li>
              )}
              {data.fling_effect && (
                <li>
                  <DossierField
                    termKey="fling-effect"
                    value={titleCase(data.fling_effect)}
                  />
                </li>
              )}
              {data.attributes.length > 0 && (
                <li>
                  <DossierField
                    termKey="attributes"
                    value={data.attributes.map((a) => titleCase(a)).join(" · ")}
                  />
                </li>
              )}
            </ul>
          </div>

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
        </div>
      </div>

      {data.held_by_pokemon.length > 0 && (
        <div className="hud-card" style={{ marginTop: "1rem" }}>
          <div className="hud-card__title">
            <span>Held by</span>
            <span>{data.held_by_pokemon.length}</span>
          </div>
          <ul className="pill-list">
            {data.held_by_pokemon.map((p) => (
              <li key={p.name}>
                <Link to="/pokemon/$name" params={{ name: p.name }} className="pill">
                  {titleCase(p.name)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

export function ItemDetailPage() {
  const { name } = itemRoute.useParams();
  const display = titleCase(name);
  return (
    <ConsoleDevice
      title="POKÉ DEX · ITEM"
      subtitle={display}
      ariaLabel={`Item: ${display}`}
      headerAction={<SpeakButton kind="item" name={name.toLowerCase()} displayName={display} />}
    >
      <Suspense fallback={<div className="skeleton" style={{ height: "18rem" }} />}>
        <ItemContent name={name.toLowerCase()} />
      </Suspense>
    </ConsoleDevice>
  );
}
