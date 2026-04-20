import { Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { speciesBundleQuery } from "~/api/queries";
import { speciesRoute } from "~/router";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { DossierField } from "~/components/DossierField";
import { titleCase } from "~/utils/formatters";

function SpeciesContent({ name }: { name: string }) {
  const { data } = useSuspenseQuery(speciesBundleQuery(name));

  return (
    <div className="screen__hud" style={{ gridTemplateColumns: "1fr" }}>
      <div>
        <p className="hud-row">
          <b>SPECIES</b> · {titleCase(data.name)}
        </p>
        <h1 className="hud-name">{data.display_name}</h1>
        {data.genus && <div className="hud-genus">{data.genus}</div>}
        {data.flavor && <p className="hud-flavor">{data.flavor}</p>}
      </div>

      <div className="hud-card">
        <div className="hud-card__title">
          <span>Dossier</span>
          <span className="mono">
            {data.is_legendary
              ? "LEGENDARY"
              : data.is_mythical
                ? "MYTHICAL"
                : data.is_baby
                  ? "BABY"
                  : "STANDARD"}
          </span>
        </div>
        <ul className="dossier-list">
          <li>
            <DossierField
              termKey="generation"
              value={titleCase(data.generation.replace("generation-", ""))}
            />
          </li>
          <li>
            <DossierField termKey="color" value={titleCase(data.color)} />
          </li>
          {data.habitat && (
            <li>
              <DossierField termKey="habitat" value={titleCase(data.habitat)} />
            </li>
          )}
          {data.shape && (
            <li>
              <DossierField termKey="shape" value={titleCase(data.shape)} />
            </li>
          )}
          <li>
            <DossierField
              termKey="catch-rate"
              value={
                <>
                  <span className="mono">{data.capture_rate}</span>
                  <small style={{ color: "var(--phosphor-dim)" }}> /255</small>
                </>
              }
              valueText={`${data.capture_rate} / 255`}
            />
          </li>
          <li>
            <DossierField
              termKey="happiness"
              value={<span className="mono">{data.base_happiness}</span>}
              valueText={String(data.base_happiness)}
            />
          </li>
        </ul>
      </div>

      <div className="hud-card">
        <div className="hud-card__title">
          <span>Varieties</span>
          <span>{data.varieties.length}</span>
        </div>
        <ul className="pill-list">
          {data.varieties.map((v) => (
            <li key={v.name}>
              <Link to="/pokemon/$name" params={{ name: v.name }} className="pill">
                <span>{titleCase(v.name)}</span>
                {v.is_default && (
                  <span style={{ color: "var(--amber)", marginLeft: "0.35rem" }}>(default)</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SpeciesContentSkeleton({ urlName }: { urlName: string }) {
  return (
    <div className="screen__hud" style={{ gridTemplateColumns: "1fr" }} aria-busy="true">
      <div>
        <p className="hud-row">
          <b>SPECIES</b> · {titleCase(urlName)}
        </p>
        <h1 className="hud-name" style={{ opacity: 0.6 }}>
          Loading…
        </h1>
        <div className="hud-genus">&nbsp;</div>
        <div className="skeleton" style={{ height: "3.5rem", marginTop: "0.75rem" }} />
      </div>
      <div className="hud-card">
        <div className="hud-card__title">
          <span>Dossier</span>
          <span className="mono">—</span>
        </div>
        <div className="skeleton" style={{ height: "8rem" }} />
      </div>
      <div className="hud-card">
        <div className="hud-card__title">
          <span>Varieties</span>
          <span>—</span>
        </div>
        <div className="skeleton" style={{ height: "2.5rem" }} />
      </div>
    </div>
  );
}

export function SpeciesDetailPage() {
  const { name } = speciesRoute.useParams();
  const displayName = titleCase(name);
  return (
    <ConsoleDevice
      title="POKÉ DEX · SPECIES"
      subtitle={displayName}
      ariaLabel={`Species readout for ${displayName}`}
    >
      <Suspense fallback={<SpeciesContentSkeleton urlName={name} />}>
        <SpeciesContent name={name.toLowerCase()} />
      </Suspense>
    </ConsoleDevice>
  );
}
