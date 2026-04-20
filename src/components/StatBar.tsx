import { STAT_LABELS } from "~/utils/formatters";

type Props = { name: string; value: number; max?: number };

export function StatBar({ name, value, max = 255 }: Props) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const label = STAT_LABELS[name] ?? name;
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
      <div
        className="stat__bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={`${label} stat ${value} out of ${max}`}
      >
        <div className="stat__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
