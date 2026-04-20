import { describe, expect, it } from "vitest";
import type { BundleDefenderType } from "~/types/bundles";
import {
  breakdownForAttack,
  damageTaken,
  multiplierHeadline,
  multiplierLabel,
  multiplierToken,
} from "../typeEffectiveness";

const grass: BundleDefenderType = {
  name: "grass",
  no_damage_from: [],
  double_damage_from: ["fire", "ice", "poison", "flying", "bug"],
  half_damage_from: ["water", "electric", "grass", "ground"],
};
const poison: BundleDefenderType = {
  name: "poison",
  no_damage_from: [],
  double_damage_from: ["ground", "psychic"],
  half_damage_from: ["grass", "fighting", "poison", "bug", "fairy"],
};
const ghost: BundleDefenderType = {
  name: "ghost",
  no_damage_from: ["normal", "fighting"],
  double_damage_from: ["ghost", "dark"],
  half_damage_from: ["poison", "bug"],
};

describe("damageTaken", () => {
  it("multiplies across defender types", () => {
    // Bulbasaur: grass + poison. Fire = 2× (grass), 1× (poison) = 2×.
    // Bug = 2× (grass) × 2× (grass poison weakness?) Actually bug is 2× grass, 0.5× poison → 1×.
    const m = damageTaken([grass, poison]);
    expect(m.fire).toBe(2);
    expect(m.ice).toBe(2);
    expect(m.psychic).toBe(2);
    // Ground: 0.5× grass, 2× poison = 1×.
    expect(m.ground).toBe(1);
    // Grass: 0.5× grass, 0.5× poison = 0.25.
    expect(m.grass).toBe(0.25);
  });

  it("respects no_damage_from = 0", () => {
    const m = damageTaken([ghost]);
    expect(m.normal).toBe(0);
    expect(m.fighting).toBe(0);
    expect(m.ghost).toBe(2);
  });

  it("clamps a single defender to the expected table", () => {
    const m = damageTaken([grass]);
    expect(m.fire).toBe(2);
    expect(m.water).toBe(0.5);
    expect(m.normal).toBe(1);
  });
});

describe("breakdownForAttack", () => {
  it("returns per-defender factors", () => {
    const rows = breakdownForAttack("fire", [grass, poison]);
    expect(rows).toEqual([
      { defender: "grass", factor: 2 },
      { defender: "poison", factor: 1 },
    ]);
  });
});

describe("multiplier helpers", () => {
  it("labels match table", () => {
    expect(multiplierLabel(0)).toBe("×0");
    expect(multiplierLabel(0.25)).toBe("×¼");
    expect(multiplierLabel(0.5)).toBe("×½");
    expect(multiplierLabel(1)).toBe("×1");
    expect(multiplierLabel(2)).toBe("×2");
    expect(multiplierLabel(4)).toBe("×4");
  });
  it("tokens match table", () => {
    expect(multiplierToken(0)).toBe("zero");
    expect(multiplierToken(0.25)).toBe("qtr");
    expect(multiplierToken(0.5)).toBe("half");
    expect(multiplierToken(1)).toBe("one");
    expect(multiplierToken(2)).toBe("two");
    expect(multiplierToken(4)).toBe("four");
  });
  it("headline covers every multiplier", () => {
    for (const m of [0, 0.25, 0.5, 1, 2, 4]) {
      expect(multiplierHeadline(m).length).toBeGreaterThan(0);
    }
  });
});
