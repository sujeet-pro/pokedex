import { Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { berryBundleQuery, berryIndexQuery } from "~/api/queries";
import { useAdjacentNav } from "~/hooks/useAdjacentNav";
import { berryRoute } from "~/router";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { DossierField } from "~/components/DossierField";
import { SpeakButton } from "~/components/SpeakButton";
import { TypeCartridge } from "~/components/TypeCartridge";
import { titleCase } from "~/utils/formatters";

function BerryContent({ name }: { name: string }) {
  const { data } = useSuspenseQuery(berryBundleQuery(name));
  const { data: index } = useQuery(berryIndexQuery());
  useAdjacentNav(index?.entries, data.name, "/berry");

  return (
    <div className="screen__hud">
      <div>
        <p className="hud-row">
          <b>BERRY</b> · {titleCase(data.firmness)}
        </p>
        <h1 className="hud-name">{data.display_name}</h1>
        <div className="hud-genus">Natural gift type</div>
        <div className="cart-row">
          <TypeCartridge name={data.natural_gift_type} />
        </div>
        <div className="hud-sprite" style={{ padding: "2rem" }}>
          <img
            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${data.name}-berry.png`}
            alt={`${data.display_name} sprite`}
            style={{ width: "80%", imageRendering: "pixelated" }}
          />
        </div>
      </div>

      <div className="hud__column">
        <div className="hud-card">
          <div className="hud-card__title">
            <span>Dossier</span>
            <span>meta</span>
          </div>
          <ul className="dossier-list">
            <li>
              <DossierField termKey="firmness" value={titleCase(data.firmness)} />
            </li>
            <li>
              <DossierField
                termKey="growth"
                value={`${data.growth_time}h/stage × 4`}
                valueText={`${data.growth_time} hours per stage, 4 stages`}
              />
            </li>
            <li>
              <DossierField termKey="max-harvest" value={`${data.max_harvest} berries`} />
            </li>
            <li>
              <DossierField termKey="size" value={`${data.size} mm`} />
            </li>
            <li>
              <DossierField termKey="smoothness" value={String(data.smoothness)} />
            </li>
            <li>
              <DossierField termKey="soil-dryness" value={String(data.soil_dryness)} />
            </li>
            <li>
              <DossierField
                termKey="natural-gift"
                value={`${data.natural_gift_power} power`}
                valueText={`${data.natural_gift_power} base power`}
              />
            </li>
          </ul>
        </div>

        <div className="hud-card">
          <div className="hud-card__title">
            <span>Flavor profile</span>
            <span>5</span>
          </div>
          <ul className="dossier-list">
            {data.flavors.map((f) => (
              <li key={f.name}>
                <DossierField
                  termKey={`flavor-${f.name}`}
                  value={
                    <>
                      <span className="mono">{f.potency}</span>
                      {f.potency > 0 && <span style={{ marginLeft: "0.35rem" }}>●●●</span>}
                    </>
                  }
                  valueText={`${f.potency} potency`}
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="hud-card">
          <div className="hud-card__title">
            <span>Item form</span>
          </div>
          <ul className="pill-list">
            <li>
              <Link to="/item/$name" params={{ name: data.item.name }} className="pill">
                {titleCase(data.item.name)}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export function BerryDetailPage() {
  const { name } = berryRoute.useParams();
  const display = `${titleCase(name)} Berry`;
  return (
    <ConsoleDevice
      title="POKÉ DEX · BERRY"
      subtitle={display}
      ariaLabel={display}
      headerAction={<SpeakButton kind="berry" name={name.toLowerCase()} displayName={display} />}
    >
      <Suspense fallback={<div className="skeleton" style={{ height: "18rem" }} />}>
        <BerryContent name={name.toLowerCase()} />
      </Suspense>
    </ConsoleDevice>
  );
}
