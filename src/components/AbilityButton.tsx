import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { abilityBundleQuery } from "~/api/queries";
import { titleCase } from "~/utils/formatters";
import { InfoPopover } from "./InfoPopover";
import "~/styles/components/AbilityButton.css";

type Props = {
  name: string;
  isHidden: boolean;
};

function AbilityBody({ name }: { name: string }) {
  const { data, isLoading, isError } = useQuery(abilityBundleQuery(name));

  if (isLoading) {
    return (
      <div className="info-pop__loading" role="status" aria-live="polite">
        <span className="visually-hidden">Loading ability details</span>
        <div className="skeleton" style={{ height: "0.8rem", width: "80%" }} />
        <div className="skeleton" style={{ height: "0.8rem", width: "60%" }} />
        <div className="skeleton" style={{ height: "0.8rem", width: "95%" }} />
      </div>
    );
  }
  if (isError || !data) {
    return <p className="info-pop__text">Ability details unavailable right now.</p>;
  }

  return (
    <>
      {data.short_effect && <p className="info-pop__summary">{data.short_effect}</p>}
      {data.effect && data.effect !== data.short_effect && (
        <p className="info-pop__text">{data.effect}</p>
      )}
      {data.flavor && <p className="info-pop__flavor">{data.flavor}</p>}
    </>
  );
}

export function AbilityButton({ name, isHidden }: Props) {
  const display = titleCase(name);
  return (
    <InfoPopover
      trigger={
        <button
          type="button"
          className={`ability-btn ability-btn--${isHidden ? "hidden" : "std"}`}
          aria-label={`Ability ${display}${isHidden ? " (hidden)" : ""} — explain`}
        >
          <span className="ability-btn__name">{display}</span>
          <span className="ability-btn__tag">{isHidden ? "HIDDEN" : "STANDARD"}</span>
        </button>
      }
      title={display}
      subtitle={isHidden ? "Hidden ability" : "Standard ability"}
      ariaLabel={`${display} ability — explanation`}
      footer={
        <Link to="/ability/$name" params={{ name }} className="info-pop__link">
          View full ability →
        </Link>
      }
    >
      <AbilityBody name={name} />
    </InfoPopover>
  );
}
