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
  en:
    "You are a warm Pokédex storyteller writing prose meant to be read aloud for three to five minutes. " +
    "From the structured profile below, write a single flowing story in five paragraphs separated by blank lines, " +
    "between six hundred and eight hundred words. Speak in second person, present tense. " +
    "Cover, in order: opening portrait (silhouette, colours, demeanour, typing); origin and habitat with regional folklore; " +
    "daily life and temperament; battle craft (abilities in plain language, what its typing means for matchups); " +
    "and a closing reflection. Never read numeric stats aloud. No markdown, lists, headings, quotes, URLs, or preamble.",
  es:
    "Eres un narrador cálido del Pokédex que escribe prosa pensada para leerse en voz alta durante tres a cinco minutos. " +
    "A partir del perfil estructurado a continuación, escribe una sola historia fluida en cinco párrafos separados por líneas en blanco, " +
    "entre seiscientas y ochocientas palabras. Habla en segunda persona y en presente. " +
    "Cubre, en orden: primer retrato (silueta, colores, actitud, tipo); origen y hábitat con folclore regional; " +
    "vida cotidiana y temperamento; destreza en combate (habilidades explicadas con palabras sencillas y lo que significa su tipo frente a otros); " +
    "y una reflexión final. Nunca leas cifras en voz alta. Sin markdown, listas, títulos, comillas, URL ni preámbulos.",
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
  const hiddenAbility = bundle.abilities.find((a) => a.is_hidden)?.display_name ?? "";
  const abilityLine = joinList(abilityNames);
  const habitat = bundle.species.habitat ? titleCase(bundle.species.habitat) : "";
  const genus = bundle.species.genus;
  const color = bundle.species.color ? titleCase(bundle.species.color) : "";
  const shape = bundle.species.shape ? titleCase(bundle.species.shape) : "";
  const generation = titleCase(bundle.species.generation.replace(/^generation-/, ""));
  const eggGroups = joinList(bundle.species.egg_groups.map(titleCase));
  const flavor = (bundle.species.flavor_text ?? "").replace(/\s+/g, " ").trim();

  const weaknesses = new Set<string>();
  const resists = new Set<string>();
  const immune = new Set<string>();
  for (const def of bundle.defenders) {
    for (const w of def.double_damage_from) weaknesses.add(titleCase(w));
    for (const w of def.half_damage_from) resists.add(titleCase(w));
    for (const w of def.no_damage_from) immune.add(titleCase(w));
  }

  const evoNames: string[] = [];
  if (bundle.evolution_chain) {
    const walk = (node: typeof bundle.evolution_chain): void => {
      if (!node) return;
      evoNames.push(node.display_name);
      for (const child of node.evolves_to) walk(child);
    };
    walk(bundle.evolution_chain);
  }
  const evoLine = joinList(evoNames);

  const richContextLines: string[] = [
    `Name: ${bundle.display_name}`,
    `Kind: ${genus || "Pokémon"}`,
    `Types: ${typeLine || "Unknown"}`,
    `Generation: ${generation}`,
  ];
  if (habitat) richContextLines.push(`Habitat: ${habitat}`);
  if (shape) richContextLines.push(`Body shape: ${shape}`);
  if (color) richContextLines.push(`Body colour: ${color}`);
  if (abilityLine) richContextLines.push(`Signature abilities: ${abilityLine}`);
  if (hiddenAbility) richContextLines.push(`Hidden ability: ${hiddenAbility}`);
  if (eggGroups) richContextLines.push(`Egg groups: ${eggGroups}`);
  if (evoLine && evoNames.length > 1) {
    richContextLines.push(`Evolution line: ${evoLine}`);
  }
  if (weaknesses.size > 0) richContextLines.push(`Weak to: ${[...weaknesses].join(", ")}`);
  if (resists.size > 0) richContextLines.push(`Resists: ${[...resists].join(", ")}`);
  if (immune.size > 0) richContextLines.push(`Immune to: ${[...immune].join(", ")}`);
  if (bundle.species.is_legendary) richContextLines.push("Status: Legendary");
  else if (bundle.species.is_mythical) richContextLines.push("Status: Mythical");
  else if (bundle.species.is_baby) richContextLines.push("Status: Baby Pokémon");
  if (flavor) richContextLines.push(`Pokédex flavour text: ${flavor}`);

  const richContext = richContextLines.join("\n");

  let friendlyFallback: string;
  if (locale === "es") {
    const pieces: string[] = [];
    pieces.push(
      `Te presento a ${bundle.display_name}, un Pokémon ${genus ? `de la categoría ${genus.toLowerCase()}` : "sorprendente"}${
        typeLine ? ` de tipo ${typeLine}` : ""
      }${color ? `, con pelaje ${color.toLowerCase()}` : ""}.`,
    );
    if (habitat) {
      pieces.push(`Los entrenadores suelen encontrarlo en hábitats de tipo ${habitat.toLowerCase()}, donde se siente como en casa.`);
    } else {
      pieces.push("Destaca por su silueta única y por un carácter muy propio.");
    }
    if (flavor) {
      pieces.push(flavor);
    }
    if (abilityLine) {
      pieces.push(`En combate se apoya en su habilidad ${abilityLine}, que puede inclinar la balanza en el momento justo.`);
    } else if (bundle.species.is_legendary) {
      pieces.push("La leyenda cuenta que solo unos pocos entrenadores han logrado cruzarse con él.");
    } else {
      pieces.push("Su perfil es uno de los más reconocibles del Pokédex.");
    }
    if (weaknesses.size > 0) {
      pieces.push(`Aun así conviene cuidarlo de los ataques de tipo ${[...weaknesses].slice(0, 3).join(", ").toLowerCase()}, y un buen entrenador lo tiene en cuenta.`);
    }
    if (evoNames.length > 1) {
      pieces.push(`Forma parte de una línea evolutiva que reúne a ${joinList(evoNames)}.`);
    }
    friendlyFallback = pieces.join(" ");
  } else {
    const pieces: string[] = [];
    pieces.push(
      `Meet ${bundle.display_name}, a ${genus ? genus.toLowerCase() : "remarkable Pokémon"}${
        typeLine ? ` with a ${typeLine} typing` : ""
      }${color ? ` and a ${color.toLowerCase()} coat` : ""}.`,
    );
    if (habitat) {
      pieces.push(`Trainers often come across it in ${habitat.toLowerCase()} habitats, where it feels most at home.`);
    } else {
      pieces.push("It is known for a striking silhouette and a temperament all its own.");
    }
    if (flavor) {
      pieces.push(flavor);
    }
    if (abilityLine) {
      pieces.push(`In battle it leans on its ${abilityLine} ability, which can tip a fight at just the right moment.`);
    } else if (bundle.species.is_legendary) {
      pieces.push("Legend whispers that only a lucky few ever cross its path.");
    } else {
      pieces.push("Its profile is one of the most recognisable in the Pokédex.");
    }
    if (weaknesses.size > 0) {
      pieces.push(`It still has to watch for ${[...weaknesses].slice(0, 3).join(", ").toLowerCase()} attacks, and a careful trainer plans around them.`);
    }
    if (evoNames.length > 1) {
      pieces.push(`It belongs to an evolution line that includes ${joinList(evoNames)}.`);
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
  if (locale === "es") {
    const pieces: string[] = [];
    pieces.push(
      `La baya ${bundle.display_name} es una pequeña maravilla${
        firmness ? ` de pulpa ${firmness.toLowerCase()}` : ""
      }.`
    );
    if (flavorLine) {
      pieces.push(`Se reconoce por sus notas ${flavorLine.toLowerCase()}.`);
    } else {
      pieces.push("Su sabor es sutil y difícil de describir.");
    }
    if (giftType) {
      pieces.push(
        `Usada en Don Natural, libera un golpe de tipo ${giftType.toLowerCase()}.`
      );
    } else {
      pieces.push("Ha encontrado un hueco en la mochila de muchos entrenadores.");
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
  if (locale === "es") {
    const pieces: string[] = [];
    pieces.push(
      `${bundle.display_name} es un objeto${category ? ` de la categoría ${category.toLowerCase()}` : ""}.`
    );
    pieces.push("En el momento justo puede dar un empujón decisivo en un combate o en una aventura.");
    if (holder) {
      pieces.push(`A veces se ve en manos de ${holder}.`);
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
  if (locale === "es") {
    const pieces: string[] = [];
    pieces.push(
      `${bundle.display_name} es un movimiento${moveType ? ` de tipo ${moveType.toLowerCase()}` : ""}${
        damageClass ? `, de la categoría ${damageClass.toLowerCase()}` : ""
      }.`
    );
    pieces.push("Dominado, puede darle la vuelta a un combate en un instante.");
    pieces.push("Muchos entrenadores lo guardan para los momentos decisivos.");
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
  if (locale === "es") {
    const pieces: string[] = [];
    pieces.push(
      `${entry.display_name} es un lugar${region ? ` de la región de ${region}` : ""} que no deja indiferente a nadie.`
    );
    if (areaLine) {
      pieces.push(`Aquí se descubren zonas como ${areaLine}.`);
    } else {
      pieces.push("Sus paisajes esconden más de un secreto para los viajeros atentos.");
    }
    pieces.push("Muchos entrenadores recuerdan con cariño su paso por aquí.");
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
  if (locale === "es") {
    const pieces: string[] = [];
    pieces.push(
      `${bundle.display_name} es una generación${region ? ` centrada en la región de ${region}` : ""} que dejó huella entre los entrenadores.`
    );
    if (versionGroups) {
      pieces.push(`Se recuerda por aventuras como ${versionGroups}.`);
    }
    pieces.push("Aportó nuevas criaturas, movimientos y habilidades al Pokédex.");
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
