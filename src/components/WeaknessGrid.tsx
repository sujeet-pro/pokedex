import { Popover } from "radix-ui";
import { Link } from "@tanstack/react-router";
import type { TypeDetail } from "~/types/pokeapi";
import {
  breakdownForAttack,
  damageTaken,
  multiplierHeadline,
  multiplierLabel,
  multiplierToken,
  type Multiplier,
} from "~/utils/typeEffectiveness";
import { ALL_TYPES, TYPE_INFO, typeInfo } from "~/utils/typeInfo";
import "~/styles/components/WeaknessGrid.css";

type Props = { defenders: TypeDetail[] };

export function WeaknessGrid({ defenders }: Props) {
  if (defenders.length === 0) return null;
  const table = damageTaken(defenders);
  const defenderNames = defenders.map(
    (d) => TYPE_INFO[d.name as keyof typeof TYPE_INFO]?.display ?? d.name,
  );

  return (
    <div className="weak">
      <div className="weak__head">
        <span>Damage taken · 18 types</span>
        <span className="weak__hint">Click a cell — Enter or Space for keyboard</span>
      </div>
      <ul className="weak__grid" role="list">
        {ALL_TYPES.map((atk) => (
          <li key={atk} className="weak__li">
            <WeaknessCell
              attacker={atk}
              mult={table[atk]}
              defenders={defenders}
              defenderNames={defenderNames}
            />
          </li>
        ))}
      </ul>
      <p className="weak__legend">
        <span className="weak__legend-item weak__legend-item--four">×4</span>
        <span className="weak__legend-item weak__legend-item--two">×2</span>
        <span className="weak__legend-item weak__legend-item--one">×1</span>
        <span className="weak__legend-item weak__legend-item--half">×½</span>
        <span className="weak__legend-item weak__legend-item--qtr">×¼</span>
        <span className="weak__legend-item weak__legend-item--zero">×0</span>
      </p>
    </div>
  );
}

function WeaknessCell({
  attacker,
  mult,
  defenders,
  defenderNames,
}: {
  attacker: keyof typeof TYPE_INFO;
  mult: Multiplier;
  defenders: TypeDetail[];
  defenderNames: string[];
}) {
  const info = TYPE_INFO[attacker];
  const token = multiplierToken(mult);
  const label = multiplierLabel(mult);
  const headline = multiplierHeadline(mult);
  const breakdown = breakdownForAttack(attacker, defenders);
  const accessibleLabel = `${info.display} attacks deal ${label} damage — ${headline}. Activate for details.`;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={`weak__cell weak__cell--${token}`}
          data-mult={mult}
          aria-label={accessibleLabel}
        >
          <span className="weak__dot" aria-hidden="true" style={{ background: info.color }} />
          <span className="weak__code" aria-hidden="true">
            {info.short}
          </span>
          <span className="weak__mult">{label}</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="weak__pop"
          sideOffset={8}
          collisionPadding={12}
          align="center"
          aria-label={`${info.display} damage explanation — ${label}`}
        >
          <header className="weak__pop-head">
            <span
              className="weak__pop-chip"
              aria-hidden="true"
              style={{ background: info.color, color: info.textColor }}
            >
              {info.short}
            </span>
            <div>
              <h3 className="weak__pop-title">{info.display}</h3>
              <p className="weak__pop-mult">
                <span className={`weak__pop-badge weak__pop-badge--${token}`}>{label}</span>
                <span>{headline}</span>
              </p>
            </div>
          </header>

          <p className="weak__pop-desc">{info.description}</p>

          <div className="weak__pop-breakdown" aria-label="Multiplier breakdown">
            <div className="weak__pop-breakdown-head">How it adds up</div>
            <ul>
              {breakdown.map((b, i) => {
                const di = typeInfo(b.defender);
                return (
                  <li key={b.defender}>
                    <span
                      className="weak__pop-breakdown-dot"
                      style={{ background: di.color }}
                      aria-hidden="true"
                    />
                    <span className="weak__pop-breakdown-text">
                      {info.display} vs {di.display}
                    </span>
                    <span className="weak__pop-breakdown-factor">{multiplierLabel(b.factor)}</span>
                    {i < breakdown.length - 1 && (
                      <span className="weak__pop-breakdown-op" aria-hidden="true">
                        ×
                      </span>
                    )}
                  </li>
                );
              })}
              <li className="weak__pop-breakdown-total">
                <span
                  aria-hidden="true"
                  className="weak__pop-breakdown-dot weak__pop-breakdown-dot--muted"
                />
                <span className="weak__pop-breakdown-text">vs {defenderNames.join(" · ")}</span>
                <span
                  className={`weak__pop-breakdown-factor weak__pop-breakdown-factor--total weak__pop-breakdown-factor--${token}`}
                >
                  {label}
                </span>
              </li>
            </ul>
          </div>

          <footer className="weak__pop-foot">
            <Link to="/type/$id" params={{ id: attacker }} className="weak__pop-link">
              View {info.display} type →
            </Link>
            <Popover.Close className="weak__pop-close" aria-label="Close explanation">
              Close
            </Popover.Close>
          </footer>

          <Popover.Arrow className="weak__pop-arrow" width={14} height={8} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
