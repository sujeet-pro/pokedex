import type { Messages } from "~/i18n";
import type { Locale } from "~/types/locales";
import { makeT } from "~/i18n";

type StatKey = `stat_${"hp" | "attack" | "defense" | "special-attack" | "special-defense" | "speed"}`;

type Stat = { name: string; base_stat: number };
type Props = { stats: Stat[]; locale: Locale };

const MAX = 180;

export function StatBars({ stats, locale }: Props) {
  const t = makeT(locale);
  return (
    <div>
      {stats.map((s) => {
        const key = `stat_${s.name}` as StatKey;
        const label = (t as (k: keyof Messages) => string)(key);
        const pct = Math.min(100, (s.base_stat / MAX) * 100);
        return (
          <div className="stat" key={s.name}>
            <span className="stat__label">{label}</span>
            <span className="stat__value">{s.base_stat}</span>
            <span className="stat__bar" aria-hidden>
              <span className="stat__fill" style={{ width: `${pct}%` }} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
