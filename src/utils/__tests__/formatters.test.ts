import { describe, expect, it } from "vitest";
import {
  cleanFlavor,
  decimetersToMeters,
  englishEntry,
  hectogramsToKg,
  padId,
  titleCase,
} from "../formatters";

describe("titleCase", () => {
  it("capitalises simple strings", () => {
    expect(titleCase("bulbasaur")).toBe("Bulbasaur");
  });
  it("splits on dashes and underscores", () => {
    expect(titleCase("mr-mime")).toBe("Mr Mime");
    expect(titleCase("flabébé_flower")).toBe("Flabébé Flower");
  });
  it("handles empty strings", () => {
    expect(titleCase("")).toBe("");
  });
});

describe("padId", () => {
  it("pads to 4 digits with #", () => {
    expect(padId(1)).toBe("#0001");
    expect(padId(1025)).toBe("#1025");
  });
});

describe("unit converters", () => {
  it("decimeters → meters", () => {
    expect(decimetersToMeters(7)).toBe("0.7 m");
    expect(decimetersToMeters(100)).toBe("10.0 m");
  });
  it("hectograms → kg", () => {
    expect(hectogramsToKg(905)).toBe("90.5 kg");
  });
});

describe("cleanFlavor", () => {
  it("collapses whitespace and trims", () => {
    expect(cleanFlavor("A\nwild\tBulbasaur   appeared.\n")).toBe("A wild Bulbasaur appeared.");
  });
});

describe("englishEntry", () => {
  it("returns the first English-language entry", () => {
    const entries = [
      { language: { name: "ja" }, value: "にほん" },
      { language: { name: "en" }, value: "en" },
    ];
    expect(englishEntry(entries)?.value).toBe("en");
  });
  it("returns undefined when no English entry exists", () => {
    expect(englishEntry([{ language: { name: "fr" }, value: "fr" }])).toBeUndefined();
  });
});
