import type { Locale } from "~/types/locales";
import type {
  BerryBundle,
  GenerationBundle,
  ItemBundle,
  LocationIndexEntry,
  MoveBundle,
  PokemonBundle,
} from "~/types/bundles";

/**
 * A narrative bundle is used by the SpeakButton to either feed the on-device
 * AI (rich, structured key/value context) or — when AI is unavailable — read
 * out a hand-written `friendlyFallback` paragraph. The `systemPrompt` is a
 * one-line voice directive the AI uses to set tone.
 */
export type Narrative = {
  richContext: string;
  friendlyFallback: string;
  systemPrompt: string;
};

/* -------------------------------------------------------------------- */
/* System prompt (voice directive)                                      */
/* -------------------------------------------------------------------- */

const SYSTEM_PROMPTS: Record<Locale, string> = {
  en: "Speak warmly in 2-4 sentences, like a Pokédex entry. No numbers, no lists, no markdown.",
  fr: "Parle chaleureusement en 2 à 4 phrases, comme une notice du Pokédex. Pas de chiffres, pas de listes, pas de markdown.",
};

function systemPrompt(locale: Locale): string {
  return SYSTEM_PROMPTS[locale];
}

/* -------------------------------------------------------------------- */
/* Small helpers                                                        */
/* -------------------------------------------------------------------- */

function joinList(items: readonly string[]): string {
  const filtered = items.filter((item) => item.length > 0);
  if (filtered.length === 0) return "";
  if (filtered.length === 1) return filtered[0] ?? "";
  if (filtered.length === 2) return `${filtered[0]} & ${filtered[1]}`;
  return `${filtered.slice(0, -1).join(", ")} & ${filtered[filtered.length - 1]}`;
}

function titleCase(input: string): string {
  return input
    .split(/[-_\s]+/)
    .map((word) => (word.length === 0 ? word : word[0]!.toUpperCase() + word.slice(1)))
    .join(" ");
}

/* -------------------------------------------------------------------- */
/* Pokémon                                                              */
/* -------------------------------------------------------------------- */

export function pokemonNarrative(bundle: PokemonBundle, locale: Locale): Narrative {
  const typeNames = bundle.types.map((t) => titleCase(t.name));
  const typeLine = joinList(typeNames);
  const abilityNames = bundle.abilities.filter((a) => !a.is_hidden).map((a) => a.display_name);
  const abilityLine = joinList(abilityNames);
  const habitat = bundle.species.habitat ? titleCase(bundle.species.habitat) : "";
  const genus = bundle.species.genus;
  const color = bundle.species.color ? titleCase(bundle.species.color) : "";

  const richContextLines: string[] = [
    `Name: ${bundle.display_name}`,
    `Kind: ${genus || "Pokémon"}`,
    `Types: ${typeLine || "Unknown"}`,
  ];
  if (habitat) richContextLines.push(`Habitat: ${habitat}`);
  if (color) richContextLines.push(`Color: ${color}`);
  if (abilityLine) richContextLines.push(`Signature abilities: ${abilityLine}`);
  if (bundle.species.is_legendary) richContextLines.push("Status: Legendary");
  else if (bundle.species.is_mythical) richContextLines.push("Status: Mythical");

  const richContext = richContextLines.join("\n");

  let friendlyFallback: string;
  if (locale === "fr") {
    const pieces: string[] = [];
    pieces.push(
      `${bundle.display_name} est un Pokémon ${genus ? `de catégorie ${genus.toLowerCase()}` : "étonnant"}${
        typeLine ? ` de type ${typeLine}` : ""
      }.`
    );
    if (habitat) {
      pieces.push(`On le rencontre souvent dans un habitat de type ${habitat.toLowerCase()}.`);
    } else {
      pieces.push("Il se fait remarquer par son allure unique et son caractère bien trempé.");
    }
    if (abilityLine) {
      pieces.push(`Il est réputé pour son talent ${abilityLine}.`);
    } else if (bundle.species.is_legendary) {
      pieces.push("La légende dit que peu de dresseurs ont eu la chance de le croiser.");
    } else {
      pieces.push("Sa silhouette fait partie des plus reconnaissables du Pokédex.");
    }
    friendlyFallback = pieces.join(" ");
  } else {
    const pieces: string[] = [];
    pieces.push(
      `${bundle.display_name} is a ${genus ? genus.toLowerCase() : "remarkable Pokémon"}${
        typeLine ? ` with a ${typeLine} typing` : ""
      }.`
    );
    if (habitat) {
      pieces.push(`Trainers often come across it in ${habitat.toLowerCase()} habitats.`);
    } else {
      pieces.push("It is known for a striking silhouette and a temperament all its own.");
    }
    if (abilityLine) {
      pieces.push(`It is celebrated for the ${abilityLine} ability.`);
    } else if (bundle.species.is_legendary) {
      pieces.push("Legend whispers that only a lucky few ever cross its path.");
    } else {
      pieces.push("Its profile is one of the most recognisable in the Pokédex.");
    }
    friendlyFallback = pieces.join(" ");
  }

  return { richContext, friendlyFallback, systemPrompt: systemPrompt(locale) };
}

/* -------------------------------------------------------------------- */
/* Berry                                                                */
/* -------------------------------------------------------------------- */

export function berryNarrative(bundle: BerryBundle, locale: Locale): Narrative {
  const firmness = bundle.firmness ? titleCase(bundle.firmness) : "";
  const giftType = bundle.natural_gift_type ? titleCase(bundle.natural_gift_type) : "";
  const topFlavors = bundle.flavors
    .filter((f) => f.potency > 0)
    .toSorted((a, b) => b.potency - a.potency)
    .slice(0, 2)
    .map((f) => titleCase(f.name));
  const flavorLine = joinList(topFlavors);

  const richContextLines: string[] = [`Name: ${bundle.display_name}`];
  if (firmness) richContextLines.push(`Firmness: ${firmness}`);
  if (flavorLine) richContextLines.push(`Dominant flavours: ${flavorLine}`);
  if (giftType) richContextLines.push(`Natural-gift type: ${giftType}`);
  const richContext = richContextLines.join("\n");

  let friendlyFallback: string;
  if (locale === "fr") {
    const pieces: string[] = [];
    pieces.push(
      `La baie ${bundle.display_name} est une petite merveille${
        firmness ? ` à la chair ${firmness.toLowerCase()}` : ""
      }.`
    );
    if (flavorLine) {
      pieces.push(`Elle se reconnaît à ses notes ${flavorLine.toLowerCase()}.`);
    } else {
      pieces.push("Sa saveur est subtile et difficile à décrire.");
    }
    if (giftType) {
      pieces.push(
        `Utilisée en Don Naturel, elle libère une puissance du type ${giftType.toLowerCase()}.`
      );
    } else {
      pieces.push("Elle trouve sa place dans la besace de nombreux dresseurs.");
    }
    friendlyFallback = pieces.join(" ");
  } else {
    const pieces: string[] = [];
    pieces.push(
      `The ${bundle.display_name} berry is a small wonder${
        firmness ? ` with a ${firmness.toLowerCase()} flesh` : ""
      }.`
    );
    if (flavorLine) {
      pieces.push(`It is best known for its ${flavorLine.toLowerCase()} notes.`);
    } else {
      pieces.push("Its flavour is subtle and hard to pin down.");
    }
    if (giftType) {
      pieces.push(`Used in Natural Gift, it unleashes a ${giftType.toLowerCase()}-type burst.`);
    } else {
      pieces.push("It has earned a trusted spot in many a trainer's bag.");
    }
    friendlyFallback = pieces.join(" ");
  }

  return { richContext, friendlyFallback, systemPrompt: systemPrompt(locale) };
}

/* -------------------------------------------------------------------- */
/* Item                                                                 */
/* -------------------------------------------------------------------- */

export function itemNarrative(bundle: ItemBundle, locale: Locale): Narrative {
  const category = bundle.category_display || titleCase(bundle.category);
  const holder = bundle.held_by[0]?.display_name ?? "";

  const richContextLines: string[] = [`Name: ${bundle.display_name}`];
  if (category) richContextLines.push(`Category: ${category}`);
  if (bundle.attributes.length > 0) {
    richContextLines.push(`Attributes: ${bundle.attributes.map(titleCase).join(", ")}`);
  }
  if (holder) richContextLines.push(`Sometimes held by: ${holder}`);
  const richContext = richContextLines.join("\n");

  let friendlyFallback: string;
  if (locale === "fr") {
    const pieces: string[] = [];
    pieces.push(
      `${bundle.display_name} est un objet${category ? ` de la catégorie ${category.toLowerCase()}` : ""}.`
    );
    pieces.push("Il peut donner un vrai coup de pouce au bon moment d'un combat ou d'une aventure.");
    if (holder) {
      pieces.push(`On le retrouve parfois porté par ${holder}.`);
    }
    friendlyFallback = pieces.join(" ");
  } else {
    const pieces: string[] = [];
    pieces.push(
      `${bundle.display_name} is a handy item${category ? ` in the ${category.toLowerCase()} class` : ""}.`
    );
    pieces.push("In the right moment, it can give a trainer or a Pokémon a real edge.");
    if (holder) {
      pieces.push(`${holder} has been spotted carrying one in the wild.`);
    }
    friendlyFallback = pieces.join(" ");
  }

  return { richContext, friendlyFallback, systemPrompt: systemPrompt(locale) };
}

/* -------------------------------------------------------------------- */
/* Move                                                                 */
/* -------------------------------------------------------------------- */

export function moveNarrative(bundle: MoveBundle, locale: Locale): Narrative {
  const moveType = bundle.type ? titleCase(bundle.type) : "";
  const damageClass = bundle.damage_class ? titleCase(bundle.damage_class) : "";

  const richContextLines: string[] = [`Name: ${bundle.display_name}`];
  if (moveType) richContextLines.push(`Type: ${moveType}`);
  if (damageClass) richContextLines.push(`Class: ${damageClass}`);
  if (bundle.target) richContextLines.push(`Target: ${titleCase(bundle.target)}`);
  const richContext = richContextLines.join("\n");

  let friendlyFallback: string;
  if (locale === "fr") {
    const pieces: string[] = [];
    pieces.push(
      `${bundle.display_name} est une capacité${moveType ? ` de type ${moveType.toLowerCase()}` : ""}${
        damageClass ? `, de la catégorie ${damageClass.toLowerCase()}` : ""
      }.`
    );
    pieces.push("Maîtrisée, elle peut renverser l'issue d'un combat en un instant.");
    pieces.push("Beaucoup de dresseurs la gardent en réserve pour les moments décisifs.");
    friendlyFallback = pieces.join(" ");
  } else {
    const pieces: string[] = [];
    pieces.push(
      `${bundle.display_name} is a${moveType ? ` ${moveType.toLowerCase()}-type` : ""} move${
        damageClass ? ` in the ${damageClass.toLowerCase()} class` : ""
      }.`
    );
    pieces.push("Timed well, it can turn the tide of a battle in a single beat.");
    pieces.push("Many trainers keep it close for moments that really matter.");
    friendlyFallback = pieces.join(" ");
  }

  return { richContext, friendlyFallback, systemPrompt: systemPrompt(locale) };
}

/* -------------------------------------------------------------------- */
/* Location                                                             */
/* -------------------------------------------------------------------- */

export function locationNarrative(entry: LocationIndexEntry, locale: Locale): Narrative {
  const region = entry.region ? titleCase(entry.region) : "";
  const areas = entry.areas.slice(0, 3).map((a) => a.display_name);
  const areaLine = joinList(areas);

  const richContextLines: string[] = [`Name: ${entry.display_name}`];
  if (region) richContextLines.push(`Region: ${region}`);
  if (areaLine) richContextLines.push(`Notable areas: ${areaLine}`);
  const richContext = richContextLines.join("\n");

  let friendlyFallback: string;
  if (locale === "fr") {
    const pieces: string[] = [];
    pieces.push(
      `${entry.display_name} est un lieu${region ? ` de la région de ${region}` : ""} qui ne laisse personne indifférent.`
    );
    if (areaLine) {
      pieces.push(`On y découvre notamment ${areaLine}.`);
    } else {
      pieces.push("Ses paysages recèlent plus d'un secret pour les voyageurs attentifs.");
    }
    pieces.push("Beaucoup de dresseurs gardent un souvenir ému de leur passage ici.");
    friendlyFallback = pieces.join(" ");
  } else {
    const pieces: string[] = [];
    pieces.push(
      `${entry.display_name} is a place${region ? ` in the ${region} region` : ""} that leaves a mark on every traveller.`
    );
    if (areaLine) {
      pieces.push(`It is home to areas such as ${areaLine}.`);
    } else {
      pieces.push("Its scenery hides plenty of surprises for the attentive explorer.");
    }
    pieces.push("Many trainers look back on their visit here with a smile.");
    friendlyFallback = pieces.join(" ");
  }

  return { richContext, friendlyFallback, systemPrompt: systemPrompt(locale) };
}

/* -------------------------------------------------------------------- */
/* Generation                                                           */
/* -------------------------------------------------------------------- */

export function generationNarrative(bundle: GenerationBundle, locale: Locale): Narrative {
  const region = bundle.main_region ? titleCase(bundle.main_region) : "";
  const versionGroups = joinList(bundle.version_groups.slice(0, 2).map(titleCase));

  const richContextLines: string[] = [`Name: ${bundle.display_name}`];
  if (region) richContextLines.push(`Main region: ${region}`);
  if (versionGroups) richContextLines.push(`Version groups: ${versionGroups}`);
  const richContext = richContextLines.join("\n");

  let friendlyFallback: string;
  if (locale === "fr") {
    const pieces: string[] = [];
    pieces.push(
      `${bundle.display_name} est une génération${region ? ` centrée sur la région de ${region}` : ""} qui a marqué les dresseurs.`
    );
    if (versionGroups) {
      pieces.push(`On la retrouve dans les aventures de ${versionGroups}.`);
    }
    pieces.push("Elle a enrichi le Pokédex de nouvelles créatures, capacités et talents.");
    friendlyFallback = pieces.join(" ");
  } else {
    const pieces: string[] = [];
    pieces.push(
      `${bundle.display_name} is a generation${region ? ` centred on the ${region} region` : ""} that left its mark on trainers everywhere.`
    );
    if (versionGroups) {
      pieces.push(`It is remembered through adventures like ${versionGroups}.`);
    }
    pieces.push("It added fresh creatures, moves and abilities to the Pokédex.");
    friendlyFallback = pieces.join(" ");
  }

  return { richContext, friendlyFallback, systemPrompt: systemPrompt(locale) };
}
