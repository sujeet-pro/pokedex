import { Popover } from "radix-ui";
import { Link } from "@tanstack/react-router";
import type { BundleDefenderType } from "~/types/bundles";
import type { Locale } from "~/types/locales";
import { typeInfo } from "~/lib/typeInfo";

type Props = {
  defenders: BundleDefenderType[];
  locale: Locale;
};

const ATTACKING_TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy",
] as const;

type AttackingType = (typeof ATTACKING_TYPES)[number];

type BreakdownRow = {
  defender: string;
  factor: number;
};

type CellData = {
  attacker: AttackingType;
  multiplier: number;
  breakdown: BreakdownRow[];
};

function classifyModifier(m: number): "four" | "two" | "one" | "half" | "qtr" | "zero" {
  if (m === 0) return "zero";
  if (m >= 4) return "four";
  if (m >= 2) return "two";
  if (m <= 0.25) return "qtr";
  if (m <= 0.5) return "half";
  return "one";
}

function formatMult(m: number): string {
  if (m === 0) return "×0";
  if (m === 0.25) return "×¼";
  if (m === 0.5) return "×½";
  if (m === 1) return "×1";
  if (m === 2) return "×2";
  if (m === 4) return "×4";
  // Fallback for non-canonical combinations.
  if (m < 1) return `×${m}`;
  return `×${m}`;
}

function computeCells(defenders: BundleDefenderType[]): CellData[] {
  return ATTACKING_TYPES.map((attacker) => {
    let multiplier = 1;
    const breakdown: BreakdownRow[] = [];
    for (const def of defenders) {
      let factor = 1;
      if (def.no_damage_from.includes(attacker)) factor = 0;
      else if (def.double_damage_from.includes(attacker)) factor = 2;
      else if (def.half_damage_from.includes(attacker)) factor = 0.5;
      multiplier *= factor;
      breakdown.push({ defender: def.name, factor });
    }
    return { attacker, multiplier, breakdown };
  });
}

/**
 * 18-type × multiplier grid. Each cell shows the short type code and the
 * rounded multiplier; clicking a cell opens a Radix popover with the
 * per-defender breakdown.
 */
export function WeaknessGrid({ defenders, locale }: Props) {
  const cells = computeCells(defenders);

  return (
    <div className="weak" aria-label="Type matchups when defending">
      <div className="weak__head">
        <span>Type matchups</span>
        <span className="weak__hint">Tap a cell for breakdown</span>
      </div>
      <ul className="weak__grid">
        {cells.map((cell) => {
          const info = typeInfo(cell.attacker);
          const mod = classifyModifier(cell.multiplier);
          const cellCls = `weak__cell weak__cell--${mod}`;
          return (
            <li key={cell.attacker} className="weak__li">
              <Popover.Root>
                <Popover.Trigger className={cellCls} aria-label={`${cell.attacker} ${formatMult(cell.multiplier)}`}>
                  <span className="weak__dot" style={{ background: info.color }} aria-hidden />
                  <span className="weak__code">{info.short}</span>
                  <span className="weak__mult">{formatMult(cell.multiplier)}</span>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content
                    className="weak__pop"
                    sideOffset={8}
                    collisionPadding={12}
                  >
                    <div className="weak__pop-head">
                      <span
                        className="weak__pop-chip"
                        style={{ background: info.color, color: info.textColor }}
                        aria-hidden
                      >
                        {info.short}
                      </span>
                      <div className="weak__pop-titles">
                        <p className="weak__pop-title">{cell.attacker}</p>
                        <p className="weak__pop-mult">
                          <span className={`weak__pop-badge weak__pop-badge--${mod}`}>
                            {formatMult(cell.multiplier)}
                          </span>
                          <span>Defending multiplier</span>
                        </p>
                      </div>
                      <Popover.Close className="weak__pop-close" aria-label="Close">
                        ×
                      </Popover.Close>
                    </div>

                    {cell.breakdown.length > 1 ? (
                      <div className="weak__pop-breakdown">
                        <div className="weak__pop-breakdown-head">Per type</div>
                        <ul>
                          {cell.breakdown.map((row) => {
                            const dinfo = typeInfo(row.defender);
                            const fmod = classifyModifier(row.factor);
                            return (
                              <li key={row.defender}>
                                <span
                                  className="weak__pop-breakdown-dot"
                                  style={{ background: dinfo.color }}
                                  aria-hidden
                                />
                                <span className="weak__pop-breakdown-text">{row.defender}</span>
                                <span
                                  className={`weak__pop-breakdown-factor weak__pop-breakdown-factor--${fmod}`}
                                >
                                  {formatMult(row.factor)}
                                </span>
                              </li>
                            );
                          })}
                          <li className="weak__pop-breakdown-total">
                            <span className="weak__pop-breakdown-dot weak__pop-breakdown-dot--muted" aria-hidden />
                            <span className="weak__pop-breakdown-text">Total</span>
                            <span className={`weak__pop-breakdown-factor weak__pop-breakdown-factor--total weak__pop-breakdown-factor--${mod}`}>
                              {formatMult(cell.multiplier)}
                            </span>
                          </li>
                        </ul>
                      </div>
                    ) : null}

                    <div className="weak__pop-foot">
                      <Link
                        to="/$lang/type/$name"
                        params={{ lang: locale, name: cell.attacker }}
                        className="weak__pop-link"
                      >
                        Open type →
                      </Link>
                    </div>
                    <Popover.Arrow className="weak__pop-arrow" width={14} height={7} />
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            </li>
          );
        })}
      </ul>
      <ul className="weak__legend" aria-hidden>
        <li className="weak__legend-item weak__legend-item--four">×4</li>
        <li className="weak__legend-item weak__legend-item--two">×2</li>
        <li className="weak__legend-item weak__legend-item--one">×1</li>
        <li className="weak__legend-item weak__legend-item--half">×½</li>
        <li className="weak__legend-item weak__legend-item--qtr">×¼</li>
        <li className="weak__legend-item weak__legend-item--zero">×0</li>
      </ul>
    </div>
  );
}
