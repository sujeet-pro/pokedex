import { Link } from "@tanstack/react-router";
import type { BundleEvoNode } from "~/types/bundles";
import type { Locale } from "~/types/locales";

type Props = {
  root: BundleEvoNode | null;
  locale: Locale;
  /** Optional slug of the currently displayed Pokémon. */
  currentSlug?: string;
};

const SPRITE_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

type Cell = { node: BundleEvoNode; depth: number; trigger?: string };

/**
 * Flatten the evolution tree into stages, breadth-first, preserving the
 * triggers for each transition. The result is [stage0, stage1, …], each
 * stage being a list of cells at that depth.
 */
function flatten(root: BundleEvoNode): Cell[][] {
  const stages: Cell[][] = [[{ node: root, depth: 0 }]];
  let frontier: Cell[] = stages[0]!;
  while (frontier.length > 0) {
    const next: Cell[] = [];
    for (const cell of frontier) {
      for (const child of cell.node.evolves_to) {
        next.push({ node: child, depth: cell.depth + 1, trigger: child.trigger });
      }
    }
    if (next.length === 0) break;
    stages.push(next);
    frontier = next;
  }
  return stages;
}

/**
 * Recursive evolution tree renderer. When the chain has branches we
 * collapse each level into a column and show trigger labels in the
 * `.evo__arr` column between them.
 */
export function EvolutionChain({ root, locale, currentSlug }: Props) {
  if (!root) return null;
  const stages = flatten(root);
  if (stages.length === 0) return null;

  const cols: React.ReactNode[] = [];
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i]!;
    cols.push(
      <div key={`stage-${i}`} className="evo__cell">
        {stage.map((cell) => (
          <EvoFrame
            key={cell.node.name}
            node={cell.node}
            locale={locale}
            current={currentSlug === cell.node.name}
          />
        ))}
      </div>,
    );
    if (i < stages.length - 1) {
      const nextStage = stages[i + 1]!;
      const triggers = Array.from(
        new Set(
          nextStage
            .map((c) => c.trigger?.trim())
            .filter((t): t is string => Boolean(t)),
        ),
      );
      cols.push(
        <div key={`arr-${i}`} className="evo__arr" aria-hidden>
          <div>→</div>
          {triggers.length > 0 ? <div>{triggers.join(" / ")}</div> : null}
        </div>,
      );
    }
  }

  return (
    <div className="evo" aria-label="Evolution chain">
      {cols}
    </div>
  );
}

function EvoFrame({
  node,
  locale,
  current,
}: {
  node: BundleEvoNode;
  locale: Locale;
  current: boolean;
}) {
  const sprite = `${SPRITE_BASE}/${node.id}.png`;
  return (
    <div data-current={current ? "true" : "false"}>
      <Link
        to="/$lang/pokemon/$name"
        params={{ lang: locale, name: node.slug }}
        className="evo__frame"
        aria-current={current ? "page" : undefined}
      >
        <img src={sprite} alt="" loading="lazy" width={96} height={96} />
      </Link>
      <div className="evo__label">{node.display_name}</div>
      <div className="evo__sub">#{node.id}</div>
    </div>
  );
}
