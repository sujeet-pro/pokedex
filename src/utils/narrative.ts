// Per-resource narrative builders for the SpeakButton. Each takes a bundle
// (and optionally supporting data) and returns:
//   - richContext: the structured prompt sent to the on-device AI
//   - friendlyFallback: a natural-sounding English paragraph used verbatim
//                       when no browser AI is available
//   - systemPrompt: the voice/style instruction for the AI

import type {
  AbilityBundle,
  BerryBundle,
  GenerationBundle,
  ItemBundle,
  LocationBundle,
  MoveBundle,
  PokemonBundle,
} from "~/types/bundles";
import { POKEMON_SYSTEM_PROMPT } from "./aiSummarize";
import { titleCase } from "./formatters";

export type Narrative = {
  richContext: string;
  friendlyFallback: string;
  systemPrompt: string;
};

const GENERIC_SYSTEM_PROMPT = (kindLabel: string) =>
  `You are a friendly narrator recording a short voiceover about a ${kindLabel}. ` +
  `Speak in two to three warm, conversational sentences. ` +
  `Lead with the ${kindLabel}'s name, then describe what it is and what's notable about it. ` +
  `Do NOT read raw numbers aloud (power, PP, cost, growth hours, etc.) — the listener can see those on screen. ` +
  `No bullet points, no headings, no markdown — just natural prose.`;

// ── Pokémon ─────────────────────────────────────────────────────────

export function pokemonNarrative(
  bundle: PokemonBundle,
  abilities: AbilityBundle[],
): Narrative {
  const name = titleCase(bundle.name);
  const types = bundle.types.map((t) => titleCase(t.name));
  const genus = bundle.species.genus ?? undefined;
  const flavor = bundle.species.flavor || undefined;
  const habitat = bundle.species.habitat ? titleCase(bundle.species.habitat) : undefined;

  const abilityLines = abilities.map((a) => {
    const summary = a.short_effect ?? a.effect;
    return summary ? `${a.display_name} — ${summary}` : a.display_name;
  });

  const weakTo = new Set<string>();
  for (const def of bundle.defenders) {
    for (const w of def.double_damage_from) weakTo.add(titleCase(w));
  }

  const rarityBits: string[] = [];
  if (bundle.species.is_legendary) rarityBits.push("legendary");
  if (bundle.species.is_mythical) rarityBits.push("mythical");
  if (bundle.species.is_baby) rarityBits.push("a baby Pokémon");

  const richContext = [
    `Name: ${name}.`,
    genus ? `Category: ${genus}.` : "",
    `Type: ${types.join(" and ")}.`,
    rarityBits.length ? `Rarity: ${rarityBits.join(", ")}.` : "",
    habitat ? `Habitat: ${habitat}.` : "",
    flavor ? `Dex entry: ${flavor}` : "",
    abilityLines.length ? `Abilities: ${abilityLines.join("; ")}.` : "",
    weakTo.size > 0 ? `Commonly weak to: ${[...weakTo].join(", ")}.` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const typePhrase =
    types.length === 2 ? `a ${types[0]} and ${types[1]} type` : `a ${types[0]} type`;
  const fallbackParts: string[] = [];
  fallbackParts.push(
    genus
      ? `This is ${name}, the ${genus.toLowerCase()}, ${typePhrase} Pokémon.`
      : `This is ${name}, ${typePhrase} Pokémon.`,
  );
  if (flavor) fallbackParts.push(flavor);
  if (abilityLines.length === 1) {
    fallbackParts.push(`Its ability is ${abilityLines[0]!.split(" — ")[0]}.`);
  } else if (abilityLines.length > 1) {
    const names = abilityLines.map((l) => l.split(" — ")[0]!);
    fallbackParts.push(`It can have abilities like ${names.join(" or ")}.`);
  }
  if (rarityBits.length) {
    fallbackParts.push(`It is considered ${rarityBits.join(" and ")}.`);
  }

  return {
    richContext,
    friendlyFallback: fallbackParts.join(" "),
    systemPrompt: POKEMON_SYSTEM_PROMPT,
  };
}

// ── Berry ───────────────────────────────────────────────────────────

export function berryNarrative(b: BerryBundle): Narrative {
  const name = b.display_name;
  const strongFlavors = b.flavors
    .filter((f) => f.potency > 0)
    .sort((a, c) => c.potency - a.potency)
    .map((f) => f.name);

  const richContext = [
    `Name: ${name}.`,
    `Firmness: ${b.firmness}.`,
    `Natural gift type: ${b.natural_gift_type}.`,
    `Flavors present: ${strongFlavors.length > 0 ? strongFlavors.join(", ") : "none dominant"}.`,
  ].join("\n");

  const flavorPhrase =
    strongFlavors.length > 0
      ? `Its strongest flavor is ${strongFlavors[0]}${strongFlavors.length > 1 ? ` with hints of ${strongFlavors.slice(1).join(" and ")}` : ""}.`
      : "Its flavors are mild.";

  const friendlyFallback = [
    `${name} is a ${b.firmness} berry.`,
    flavorPhrase,
    `When used as a Natural Gift it deals ${b.natural_gift_type}-type damage.`,
  ].join(" ");

  return {
    richContext,
    friendlyFallback,
    systemPrompt: GENERIC_SYSTEM_PROMPT("berry"),
  };
}

// ── Item ────────────────────────────────────────────────────────────

export function itemNarrative(i: ItemBundle): Narrative {
  const lines = [
    `Name: ${i.display_name}.`,
    `Category: ${i.category}.`,
    i.short_effect ? `Short effect: ${i.short_effect}` : "",
    i.effect && i.effect !== i.short_effect ? `Full effect: ${i.effect}` : "",
    i.flavor ? `Game description: ${i.flavor}` : "",
    i.attributes.length ? `Attributes: ${i.attributes.join(", ")}.` : "",
    i.held_by_pokemon.length
      ? `Held by: ${i.held_by_pokemon
          .slice(0, 3)
          .map((p) => titleCase(p.name))
          .join(", ")}${i.held_by_pokemon.length > 3 ? " and others" : ""}.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const fallback = [
    `${i.display_name} is a ${titleCase(i.category)} item.`,
    i.short_effect ?? i.effect ?? i.flavor ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    richContext: lines,
    friendlyFallback: fallback,
    systemPrompt: GENERIC_SYSTEM_PROMPT("Pokémon item"),
  };
}

// ── Move ────────────────────────────────────────────────────────────

export function moveNarrative(m: MoveBundle): Narrative {
  const lines = [
    `Name: ${m.display_name}.`,
    `Type: ${m.type}.`,
    `Damage class: ${m.damage_class}.`,
    m.short_effect ? `Short effect: ${m.short_effect}` : "",
    m.effect && m.effect !== m.short_effect ? `Full effect: ${m.effect}` : "",
    m.flavor ? `Game description: ${m.flavor}` : "",
    `Generation: ${m.generation}.`,
    m.target ? `Target: ${m.target}.` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const classPhrase =
    m.damage_class === "status"
      ? "a status move"
      : `a ${m.damage_class} ${titleCase(m.type)}-type move`;
  const fallback = [
    `${m.display_name} is ${classPhrase}.`,
    m.short_effect ?? m.flavor ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    richContext: lines,
    friendlyFallback: fallback,
    systemPrompt: GENERIC_SYSTEM_PROMPT("Pokémon move"),
  };
}

// ── Location ────────────────────────────────────────────────────────

export function locationNarrative(l: LocationBundle): Narrative {
  const lines = [
    `Name: ${l.display_name}.`,
    l.region ? `Region: ${titleCase(l.region)}.` : "",
    l.generation
      ? `Introduced in: ${titleCase(l.generation.replace("generation-", ""))}.`
      : "",
    l.areas.length ? `Contains ${l.areas.length} areas.` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const fallback = [
    l.region
      ? `${l.display_name} is a location in the ${titleCase(l.region)} region.`
      : `${l.display_name} is a location.`,
    l.areas.length ? `It contains ${l.areas.length} explorable areas.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    richContext: lines,
    friendlyFallback: fallback,
    systemPrompt: GENERIC_SYSTEM_PROMPT("Pokémon location"),
  };
}

// ── Generation ──────────────────────────────────────────────────────

export function generationNarrative(g: GenerationBundle): Narrative {
  const lines = [
    `Name: ${g.display_name}.`,
    `Main region: ${titleCase(g.main_region)}.`,
    `New species introduced: ${g.pokemon_species_count}.`,
    `New moves introduced: ${g.moves_count}.`,
    `New abilities: ${g.abilities.length}.`,
    `New types: ${g.types.length}.`,
  ].join("\n");

  const fallback = `${g.display_name} is the Pokémon generation set in the ${titleCase(g.main_region)} region. It introduced ${g.pokemon_species_count} new species and ${g.moves_count} new moves to the franchise.`;

  return {
    richContext: lines,
    friendlyFallback: fallback,
    systemPrompt: GENERIC_SYSTEM_PROMPT("Pokémon generation"),
  };
}
