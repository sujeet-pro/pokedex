import { Popover } from "radix-ui";
import type { Messages } from "~/i18n";
import { makeT } from "~/i18n";
import type { Locale } from "~/types/locales";

type Stat = { name: string; base_stat: number };

type Props = {
  stats: Stat[];
  locale: Locale;
  /** Max stat used for normalization (PokéAPI ceiling = 255). */
  maxStat?: number;
};

const STAT_AXES = [
  "hp",
  "attack",
  "defense",
  "special-attack",
  "special-defense",
  "speed",
] as const;

type AxisKey = (typeof STAT_AXES)[number];

/**
 * 6-axis hexagonal SVG radar. Each vertex has a `.radar__key` button that
 * opens a popover with the full stat name + value.
 *
 * The SVG coordinate system is 260 × 280 with the hex centered at (130, 140).
 * Radius 100 matches the aspect-ratio defined in `.radar__plot`.
 */
export function StatRadar({ stats, locale, maxStat = 255 }: Props) {
  const t = makeT(locale);
  const cx = 130;
  const cy = 140;
  const r = 100;

  // Map stats into the canonical axis order; unknown stats fall back to 0.
  const byName = new Map(stats.map((s) => [s.name as AxisKey, s.base_stat]));
  const rows = STAT_AXES.map((name, i) => {
    const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / STAT_AXES.length;
    const value = byName.get(name) ?? 0;
    const ratio = Math.min(1, value / maxStat);
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);
    const vx = cx + ratio * r * Math.cos(angle);
    const vy = cy + ratio * r * Math.sin(angle);
    return { name, value, angle, px, py, vx, vy };
  });

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const outerPolygon = rows.map((r0) => `${r0.px},${r0.py}`).join(" ");
  const dataPolygon = rows.map((r0) => `${r0.vx},${r0.vy}`).join(" ");

  const total = stats.reduce((sum, s) => sum + s.base_stat, 0);

  return (
    <div className="radar" aria-label="Base-stat radar">
      <div className="radar__plot">
        <svg
          className="radar__svg"
          viewBox="0 0 260 280"
          aria-hidden
          preserveAspectRatio="xMidYMid meet"
        >
          <g className="radar__grid">
            {gridLevels.map((lvl) => (
              <polygon
                key={lvl}
                points={rows
                  .map((r0) => `${cx + lvl * r * Math.cos(r0.angle)},${cy + lvl * r * Math.sin(r0.angle)}`)
                  .join(" ")}
              />
            ))}
            {rows.map((r0) => (
              <line
                key={`axis-${r0.name}`}
                x1={cx}
                y1={cy}
                x2={r0.px}
                y2={r0.py}
              />
            ))}
          </g>
          <polygon
            className="radar__poly"
            points={dataPolygon}
            fill="var(--phosphor)"
            fillOpacity="0.22"
          />
          <g className="radar__dots">
            {rows.map((r0) => (
              <circle key={`dot-${r0.name}`} cx={r0.vx} cy={r0.vy} r={2.5} />
            ))}
          </g>
          {/* keep the outer polygon visually even though we use radar__grid lines */}
          <polygon points={outerPolygon} fill="none" stroke="none" />
        </svg>

        <ul className="radar__keys" aria-label="Stats">
          {rows.map((r0) => {
            const key = `stat_${r0.name}` as `stat_${AxisKey}`;
            const label = (t as (k: keyof Messages) => string)(key);
            // Place keys slightly outside the vertex (20px padding along the radial axis).
            const kx = cx + (r + 20) * Math.cos(r0.angle);
            const ky = cy + (r + 20) * Math.sin(r0.angle);
            const leftPct = (kx / 260) * 100;
            const topPct = (ky / 280) * 100;
            return (
              <li
                key={r0.name}
                className="radar__key-wrap"
                style={{ left: `${leftPct}%`, top: `${topPct}%` }}
              >
                <Popover.Root>
                  <Popover.Trigger className="radar__key" aria-label={`${label} ${r0.value}`}>
                    <span className="radar__key-name">{label}</span>
                    <span className="radar__key-value">{r0.value}</span>
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content
                      className="info-pop"
                      sideOffset={8}
                      collisionPadding={12}
                    >
                      <div className="info-pop__head">
                        <div className="info-pop__titles">
                          <p className="info-pop__title">{label}</p>
                          <p className="info-pop__sub">{`${r0.value} / ${maxStat}`}</p>
                        </div>
                        <Popover.Close className="info-pop__close" aria-label="Close">
                          ×
                        </Popover.Close>
                      </div>
                      <div className="info-pop__body">
                        <div className="info-pop__meter" aria-hidden>
                          <span
                            className="info-pop__meter-fill"
                            style={{ width: `${(r0.value / maxStat) * 100}%` }}
                          />
                        </div>
                      </div>
                      <Popover.Arrow className="info-pop__arrow" width={14} height={7} />
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="radar__caption">
        <span>Total</span>
        <strong>{total}</strong>
      </div>
    </div>
  );
}
