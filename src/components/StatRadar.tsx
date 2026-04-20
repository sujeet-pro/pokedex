import { VisuallyHidden } from "radix-ui";
import { InfoPopover } from "./InfoPopover";
import { STAT_LABELS } from "~/utils/formatters";
import { statInfo } from "~/utils/statInfo";
import "~/styles/components/StatRadar.css";

type Stat = { name: string; value: number };
type Props = { stats: Stat[]; max?: number; total?: number; loading?: boolean };

// HUD layout: HP top, then clockwise: ATK, DEF, SPE, S.DEF, S.ATK
const HUD_ORDER = [
  "hp",
  "attack",
  "defense",
  "speed",
  "special-defense",
  "special-attack",
] as const;

const LABEL_SHORT: Record<string, string> = {
  hp: "HP",
  attack: "ATK",
  defense: "DEF",
  speed: "SPE",
  "special-defense": "S.DEF",
  "special-attack": "S.ATK",
};

const VIEW_W = 260;
const VIEW_H = 280;
const CX = 130;
const CY = 134;
const R_MAX = 90;
const LABEL_R = R_MAX + 22;

function toRad(deg: number): number {
  return ((deg - 90) * Math.PI) / 180;
}

function polar(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const a = toRad(angleDeg);
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

export function StatRadar({ stats, max = 150, total, loading = false }: Props) {
  const byName = new Map(stats.map((s) => [s.name, s.value]));
  const ordered = HUD_ORDER.map((name) => ({ name, value: byName.get(name) ?? 0 }));
  const sum = total ?? stats.reduce((acc, s) => acc + s.value, 0);
  const hasData = !loading && stats.length > 0;

  const vertices = ordered.map((s, i) => {
    const angle = i * 60;
    const r = Math.min(1, s.value / max) * R_MAX;
    const [x, y] = polar(CX, CY, r, angle);
    return { ...s, x, y, angle };
  });

  const polygon = vertices.map((v) => `${v.x.toFixed(2)},${v.y.toFixed(2)}`).join(" ");

  const gridRings = [0.25, 0.5, 0.75, 1].map((ratio) => {
    const r = R_MAX * ratio;
    const pts = ordered
      .map((_, i) => polar(CX, CY, r, i * 60))
      .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
      .join(" ");
    return { ratio, pts };
  });

  const ariaLabel = hasData
    ? `Base stats — total ${sum}. ` +
      ordered.map((s) => `${STAT_LABELS[s.name] ?? s.name} ${s.value}`).join(", ")
    : "Base stats — loading";

  return (
    <figure className="radar" aria-label={ariaLabel} aria-busy={loading || undefined}>
      <div className="radar__plot">
        <svg
          className="radar__svg"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          role="img"
          aria-hidden="true"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <radialGradient id="radar-fill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#9ef2b2" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#66b97a" stopOpacity="0.12" />
            </radialGradient>
          </defs>

          <g className="radar__grid">
            {gridRings.map((ring) => (
              <polygon key={ring.ratio} points={ring.pts} />
            ))}
            {ordered.map((s, i) => {
              const [x, y] = polar(CX, CY, R_MAX, i * 60);
              return <line key={`axis-${s.name}`} x1={CX} y1={CY} x2={x} y2={y} />;
            })}
          </g>

          {hasData && (
            <>
              <polygon className="radar__poly" points={polygon} fill="url(#radar-fill)" />
              <g className="radar__dots">
                {vertices.map((v) => (
                  <circle key={v.name} cx={v.x} cy={v.y} r={3.5} />
                ))}
              </g>
            </>
          )}
        </svg>

        <ul className="radar__keys" aria-label="Stat values (activate for explanation)">
          {ordered.map((s, i) => {
            const [lx, ly] = polar(CX, CY, LABEL_R, i * 60);
            const info = statInfo(s.name);
            const display = info?.display ?? STAT_LABELS[s.name] ?? s.name;
            const pct = Math.round((s.value / 255) * 100);
            return (
              <li
                key={s.name}
                className="radar__key-wrap"
                style={{
                  left: `${(lx / VIEW_W) * 100}%`,
                  top: `${(ly / VIEW_H) * 100}%`,
                }}
              >
                <InfoPopover
                  trigger={
                    <button
                      type="button"
                      className="radar__key"
                      aria-label={
                        hasData
                          ? `${display}: ${s.value}. Open explanation.`
                          : `${display}: loading. Open explanation.`
                      }
                    >
                      <span className="radar__key-name" aria-hidden="true">
                        {LABEL_SHORT[s.name] ?? s.name}
                      </span>
                      <span className="radar__key-value" aria-hidden="true">
                        {hasData ? s.value : "—"}
                      </span>
                    </button>
                  }
                  title={display}
                  subtitle={
                    <>
                      <span className="mono">{s.value}</span>
                      <span aria-hidden="true"> · base stat</span>
                    </>
                  }
                  ariaLabel={`${display} base stat: ${s.value}`}
                >
                  {info && <p className="info-pop__text">{info.description}</p>}
                  <div className="info-pop__meter" aria-hidden="true">
                    <span
                      className="info-pop__meter-fill"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <p className="info-pop__note mono">
                    {s.value} / 255 · {pct}% of max
                  </p>
                  {info?.note && <p className="info-pop__note">{info.note}</p>}
                </InfoPopover>
              </li>
            );
          })}
        </ul>
      </div>

      <figcaption className="radar__caption">
        <span>Base stats</span>
        <strong>Σ&nbsp;{sum}</strong>
      </figcaption>

      <VisuallyHidden.Root asChild>
        <dl>
          {ordered.map((s) => (
            <div key={s.name}>
              <dt>{STAT_LABELS[s.name] ?? s.name}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
      </VisuallyHidden.Root>
    </figure>
  );
}
