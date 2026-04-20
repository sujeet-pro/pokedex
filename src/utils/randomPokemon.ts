const POKEMON_COUNT = 1025;

/**
 * Picks a random Pokédex id between 1 and 1025 (inclusive).
 * A new id is rolled on every call — Home uses `useMemo(() => randomPokemonId(), [])`,
 * so the featured entry changes on every page mount / full reload but stays stable
 * during client-side navigation.
 */
export function randomPokemonId(): number {
  return Math.floor(Math.random() * POKEMON_COUNT) + 1;
}
