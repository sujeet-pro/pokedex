import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { abilityQuery } from "~/api/queries";
import { cleanFlavor, englishEntry, titleCase } from "~/utils/formatters";
import { InfoPopover } from "./InfoPopover";
import "~/styles/components/AbilityButton.css";

type Props = {
  name: string;
  isHidden: boolean;
};

function AbilityBody({ name }: { name: string }) {
  const { data, isLoading, isError } = useQuery(abilityQuery(name));

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

  const english = englishEntry(data.effect_entries);
  const flavor = englishEntry(data.flavor_text_entries);

  return (
    <>
      {english?.short_effect && <p className="info-pop__summary">{english.short_effect}</p>}
      {english?.effect && english.effect !== english.short_effect && (
        <p className="info-pop__text">{english.effect}</p>
      )}
      {flavor && <p className="info-pop__flavor">{cleanFlavor(flavor.flavor_text)}</p>}
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
        <Link to="/ability/$id" params={{ id: name }} className="info-pop__link">
          View full ability →
        </Link>
      }
    >
      <AbilityBody name={name} />
    </InfoPopover>
  );
}
