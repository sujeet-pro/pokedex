import type { ReactNode } from "react";
import { InfoPopover } from "./InfoPopover";
import { dossierInfo } from "~/utils/dossierInfo";
import "~/styles/components/DossierField.css";

type Props = {
  /** Key from `dossierInfo` — drives the label and description when `label` isn't set. */
  termKey: string;
  /** Override the displayed term label. */
  label?: string;
  /** The value shown beside / under the term and in the popover subtitle. */
  value: ReactNode;
  /** Text used for the popover subtitle and in the accessible label. Defaults to the rendered `value`. */
  valueText?: string;
  /** Optional extra body content rendered below the description. */
  extra?: ReactNode;
  /** Optional footer (e.g. a `<Link>`). */
  footer?: ReactNode;
};

export function DossierField({ termKey, label, value, valueText, extra, footer }: Props) {
  const info = dossierInfo(termKey);
  const displayLabel = label ?? info?.display ?? termKey;
  const subtitleText = valueText ?? (typeof value === "string" ? value : undefined);

  return (
    <InfoPopover
      trigger={
        <button type="button" className="dossier-field">
          <span className="dossier-field__term">{displayLabel}</span>
          <span className="dossier-field__value">{value}</span>
        </button>
      }
      title={displayLabel}
      subtitle={subtitleText}
      ariaLabel={`${displayLabel}${subtitleText ? `: ${subtitleText}` : ""} — explanation`}
      footer={footer}
    >
      {info && <p className="info-pop__text">{info.description}</p>}
      {info?.note && <p className="info-pop__note">{info.note}</p>}
      {extra}
    </InfoPopover>
  );
}
