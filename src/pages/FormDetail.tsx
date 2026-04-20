import { Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { formBundleQuery } from "~/api/queries";
import { formRoute } from "~/router";
import { ConsoleDevice } from "~/components/ConsoleDevice";
import { DossierField } from "~/components/DossierField";
import { Sprite } from "~/components/Sprite";
import { TypeCartridge } from "~/components/TypeCartridge";
import { titleCase } from "~/utils/formatters";

function FormContent({ name }: { name: string }) {
  const { data } = useSuspenseQuery(formBundleQuery(name));

  return (
    <>
      <div className="screen__hud">
        <div>
          <p className="hud-row">
            <b>FORM</b> of{" "}
            <Link
              to="/pokemon/$name"
              params={{ name: data.pokemon.name }}
              style={{ color: "var(--amber)", textDecoration: "none" }}
            >
              {titleCase(data.pokemon.name)}
            </Link>
          </p>
          <h1 className="hud-name">{data.display_name}</h1>
          <div className="cart-row" aria-label="Types">
            {data.types.map((t) => (
              <TypeCartridge key={t.name} name={t.name} />
            ))}
          </div>
        </div>
        <div className="hud-sprite">
          <Sprite src={data.sprites.front_default} alt={`${data.name} sprite`} priority />
          <span className="hud-sprite__corners" aria-hidden="true">
            <span /> <span /> <span /> <span />
          </span>
        </div>
      </div>

      <div className="hud-card" style={{ marginTop: "1rem" }}>
        <div className="hud-card__title">
          <span>Form details</span>
        </div>
        <ul className="dossier-list">
          <li>
            <DossierField termKey="form-name" value={data.form_name || "—"} />
          </li>
          <li>
            <DossierField termKey="version-group" value={titleCase(data.version_group)} />
          </li>
        </ul>
      </div>
    </>
  );
}

function FormContentSkeleton({ urlName }: { urlName: string }) {
  return (
    <>
      <div className="screen__hud" aria-busy="true">
        <div>
          <p className="hud-row">
            <b>FORM</b> · {titleCase(urlName)}
          </p>
          <h1 className="hud-name" style={{ opacity: 0.6 }}>
            Loading…
          </h1>
          <div className="cart-row" aria-hidden="true">
            <span className="skeleton" style={{ width: "72px", height: "28px" }} />
          </div>
        </div>
        <div className="hud-sprite">
          <div
            className="skeleton"
            style={{ width: "82%", aspectRatio: "1", border: 0, background: "transparent" }}
            aria-hidden="true"
          />
          <span className="hud-sprite__corners" aria-hidden="true">
            <span /> <span /> <span /> <span />
          </span>
        </div>
      </div>
      <div className="hud-card" style={{ marginTop: "1rem" }}>
        <div className="hud-card__title">
          <span>Form details</span>
        </div>
        <div className="skeleton" style={{ height: "5rem" }} />
      </div>
    </>
  );
}

export function FormDetailPage() {
  const { name } = formRoute.useParams();
  const display = titleCase(name);
  return (
    <ConsoleDevice
      title="POKÉ DEX · FORM"
      subtitle={display}
      ariaLabel={`Form readout for ${display}`}
    >
      <Suspense fallback={<FormContentSkeleton urlName={name} />}>
        <FormContent name={name.toLowerCase()} />
      </Suspense>
    </ConsoleDevice>
  );
}
