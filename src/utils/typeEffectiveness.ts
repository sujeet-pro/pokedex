import type { BundleDefenderType } from "~/types/bundles";
import { ALL_TYPES, type TypeName } from "./typeInfo";

export type Multiplier = 0 | 0.25 | 0.5 | 1 | 2 | 4;
export type PerDefFactor = 0 | 0.5 | 1 | 2;

export function damageTaken(defenders: BundleDefenderType[]): Record<TypeName, Multiplier> {
  const out = {} as Record<TypeName, Multiplier>;
  for (const atk of ALL_TYPES) {
    let m = 1;
    for (const def of defenders) {
      if (def.no_damage_from.some((x) => x === atk)) {
        m = 0;
        break;
      }
      if (def.double_damage_from.some((x) => x === atk)) {
        m *= 2;
      } else if (def.half_damage_from.some((x) => x === atk)) {
        m *= 0.5;
      }
    }
    out[atk] = m as Multiplier;
  }
  return out;
}

export function breakdownForAttack(
  attackType: string,
  defenders: BundleDefenderType[],
): { defender: string; factor: PerDefFactor }[] {
  return defenders.map((def) => {
    if (def.no_damage_from.some((x) => x === attackType)) {
      return { defender: def.name, factor: 0 as const };
    }
    if (def.double_damage_from.some((x) => x === attackType)) {
      return { defender: def.name, factor: 2 as const };
    }
    if (def.half_damage_from.some((x) => x === attackType)) {
      return { defender: def.name, factor: 0.5 as const };
    }
    return { defender: def.name, factor: 1 as const };
  });
}

export function multiplierLabel(m: Multiplier | number): string {
  if (m === 0) return "×0";
  if (m === 0.25) return "×¼";
  if (m === 0.5) return "×½";
  return `×${m}`;
}

export function multiplierToken(
  m: Multiplier | number,
): "zero" | "qtr" | "half" | "one" | "two" | "four" {
  if (m === 0) return "zero";
  if (m === 0.25) return "qtr";
  if (m === 0.5) return "half";
  if (m === 2) return "two";
  if (m === 4) return "four";
  return "one";
}

export function multiplierHeadline(m: Multiplier | number): string {
  if (m === 0) return "No effect";
  if (m === 0.25) return "Very ineffective";
  if (m === 0.5) return "Not very effective";
  if (m === 1) return "Normal damage";
  if (m === 2) return "Super effective";
  if (m === 4) return "Super super effective";
  return "—";
}
