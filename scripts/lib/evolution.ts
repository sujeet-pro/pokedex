import type { Locale } from "../../src/types/locales";
import type { BundleEvoNode } from "../../src/types/bundles";
import {
  readEvolutionChain,
  readSpeciesOrNull,
  refIdSafe,
  type EvolutionChainLink,
  type EvolutionDetail,
} from "./pokeapi";
import {
  itemDisplayName,
  speciesDisplayName,
  humanize,
} from "./name-cache";
import { slugFor } from "./slug-cache";

function formatTrigger(detail: EvolutionDetail, lang: Locale): string {
  if (detail.min_level != null) {
    return lang === "es" ? `Niv. ${detail.min_level}` : `LVL ${detail.min_level}`;
  }
  if (detail.item) {
    const id = refIdSafe(detail.item);
    if (id != null) return itemDisplayName(id, detail.item.name, lang);
    return humanize(detail.item.name);
  }
  if (detail.trigger) {
    return humanize(detail.trigger.name);
  }
  return "";
}

function walk(link: EvolutionChainLink, lang: Locale): BundleEvoNode {
  const speciesId = refIdSafe(link.species) ?? 0;
  const displayName = speciesDisplayName(speciesId, link.species.name, lang);
  // The URL we link to is the Pokémon detail page (by the pokemon slug),
  // since species share ids with their default Pokémon.
  const slug = slugFor("pokemon", speciesId, link.species.name, lang);
  const firstDetail = link.evolution_details[0];
  const trigger = firstDetail ? formatTrigger(firstDetail, lang) : "";
  return {
    name: link.species.name,
    slug,
    id: speciesId,
    display_name: displayName,
    trigger,
    evolves_to: link.evolves_to.map((child) => walk(child, lang)),
  };
}

export function buildEvolutionChainForSpecies(
  speciesId: number,
  lang: Locale,
): BundleEvoNode | null {
  const species = readSpeciesOrNull(speciesId);
  if (!species || !species.evolution_chain) return null;
  const chainId = refIdSafe(species.evolution_chain);
  if (chainId == null) return null;
  const chain = readEvolutionChain(chainId);
  if (!chain) return null;
  return walk(chain.chain, lang);
}
