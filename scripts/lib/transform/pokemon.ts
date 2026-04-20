import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { ROOT, idFromRef, readRecord, readRef } from "../io.ts";
import type {
  EvolutionChain,
  EvolutionChainLink,
  EvolutionDetailEntry,
  NamedResource,
  PaginatedList,
  Pokemon,
  PokemonSpecies,
  TypeDetail,
} from "~/types/pokeapi";
import type {
  BundleDefenderType,
  BundleEvoNode,
  PokemonBundle,
  PokemonIndexBundle,
  PokemonIndexEntry,
} from "~/types/bundles";

const SUMMARIES_DIR = resolve(ROOT, "data_generated/summary");

function english<T extends { language: { name: string } }>(entries: T[]): T | undefined {
  return entries.find((e) => e.language.name === "en");
}

function cleanFlavor(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function titleCase(name: string): string {
  return name
    .split(/[-_\s]/)
    .filter(Boolean)
    .map((p) => p[0]!.toUpperCase() + p.slice(1))
    .join(" ");
}

function evoTrigger(details: EvolutionDetailEntry | undefined): string {
  if (!details) return "";
  if (details.min_level != null) return `LVL ${details.min_level}`;
  if (details.item) return titleCase(details.item.name);
  if (details.trigger?.name) return details.trigger.name.replace(/-/g, " ");
  return "";
}

function shapeEvoTree(link: EvolutionChainLink, incomingTrigger: string): BundleEvoNode {
  return {
    name: link.species.name,
    id: idFromRef(link.species.url),
    trigger: incomingTrigger,
    evolves_to: link.evolves_to.map((child) =>
      shapeEvoTree(child, evoTrigger(child.evolution_details[0])),
    ),
  };
}

function defenderType(typeRef: NamedResource): BundleDefenderType {
  // Type records are keyed by id on disk, but the pokemon payload has the
  // canonical ref (name + url). Resolve by url.
  const raw = readRef<TypeDetail>(typeRef.url);
  return {
    name: raw.name,
    no_damage_from: raw.damage_relations.no_damage_from.map((r) => r.name),
    double_damage_from: raw.damage_relations.double_damage_from.map((r) => r.name),
    half_damage_from: raw.damage_relations.half_damage_from.map((r) => r.name),
  };
}

function hasSummary(id: number): boolean {
  return existsSync(resolve(SUMMARIES_DIR, `${id}_en.txt`));
}

// Build a name↔id map from the pokemon index so bundles can key routes by name
// but the pager can still report adjacent ids (and match the site's existing 1..1025 sort).
export function buildPokemonIndex(): PokemonIndexBundle {
  const list = readRecord<PaginatedList>("pokemon");
  const entries: PokemonIndexEntry[] = list.results
    .map((r) => {
      const id = idFromRef(r.url);
      let types: string[] = [];
      let generation = "";
      try {
        const poke = readRef<Pokemon>(r.url);
        types = poke.types.map((t) => t.type.name);
        try {
          const species = readRef<PokemonSpecies>(poke.species.url);
          generation = species.generation.name;
        } catch {
          // Species lookup may fail for some alt-form varieties that point at
          // a species we don't mirror. Leave generation blank in that case —
          // the index still includes the entry for other filters.
        }
      } catch {
        // Some list entries reference records that don't exist on disk (alt
        // forms indexed but not mirrored). Drop them; index only covers the
        // pokemon we can actually render.
      }
      return { name: r.name, id, types, generation };
    })
    .filter((e) => e.types.length > 0)
    .sort((a, b) => a.id - b.id);

  return { kind: "pokemon-index", total: entries.length, entries };
}

export function buildPokemonBundle(
  entry: { name: string; id: number },
  neighbours: { prev: PokemonIndexEntry | null; next: PokemonIndexEntry | null },
): PokemonBundle {
  const poke = readRecord<Pokemon>(`pokemon/${entry.id}`);
  const species = readRef<PokemonSpecies>(poke.species.url);

  const evolution = species.evolution_chain
    ? (() => {
        const chain = readRef<EvolutionChain>(species.evolution_chain!.url);
        return shapeEvoTree(chain.chain, "");
      })()
    : null;

  const defenders = poke.types.map((t) => defenderType(t.type));

  const flavorRaw = english(species.flavor_text_entries);
  const genusRaw = english(species.genera);

  return {
    kind: "pokemon",
    id: poke.id,
    name: poke.name,
    order: poke.order,
    height: poke.height,
    weight: poke.weight,
    base_experience: poke.base_experience,
    types: poke.types.map((t) => ({ slot: t.slot, name: t.type.name })),
    stats: poke.stats.map((s) => ({ name: s.stat.name, base_stat: s.base_stat })),
    sprites: {
      front_default: poke.sprites.front_default,
      official_artwork: poke.sprites.other?.["official-artwork"]?.front_default ?? null,
    },
    abilities: poke.abilities.map((a) => ({
      name: a.ability.name,
      is_hidden: a.is_hidden,
      slot: a.slot,
    })),
    forms: poke.forms.map((f) => ({ name: f.name })),
    species: {
      name: species.name,
      generation: species.generation.name,
      capture_rate: species.capture_rate,
      base_happiness: species.base_happiness,
      hatch_counter: species.hatch_counter,
      color: species.color.name,
      shape: species.shape?.name ?? null,
      habitat: species.habitat?.name ?? null,
      growth_rate: species.growth_rate.name,
      egg_groups: species.egg_groups.map((g) => g.name),
      is_legendary: species.is_legendary,
      is_mythical: species.is_mythical,
      is_baby: species.is_baby,
      flavor: flavorRaw ? cleanFlavor(flavorRaw.flavor_text) : "",
      genus: genusRaw?.genus ?? null,
    },
    evolution_chain: evolution,
    defenders,
    pager: {
      prev: neighbours.prev ? { name: neighbours.prev.name, id: neighbours.prev.id } : null,
      next: neighbours.next ? { name: neighbours.next.name, id: neighbours.next.id } : null,
    },
    has_summary: hasSummary(poke.id),
  };
}
