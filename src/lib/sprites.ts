const ARTWORK_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";

const PIXEL_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

const ITEM_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items";

/** Official artwork URL (pretty, high-res). Preferred for cards and detail hero. */
export function pokemonArtwork(id: number): string {
  return `${ARTWORK_BASE}/${id}.png`;
}

/** Pixelated sprite URL. Used only as a legacy fallback. */
export function pokemonPixelSprite(id: number): string {
  return `${PIXEL_BASE}/${id}.png`;
}

/**
 * Item pixel sprite. PokéAPI stores all item/berry images under
 * `sprites/items/<name>.png`, where `<name>` is the canonical slug.
 * Berries use the `<name>-berry.png` convention, matching their item name.
 */
export function itemArtwork(name: string): string {
  return `${ITEM_BASE}/${name}.png`;
}

/** Berry pixel sprite — same folder as items, with a `-berry` suffix. */
export function berryArtwork(name: string): string {
  const base = name.endsWith("-berry") ? name : `${name}-berry`;
  return `${ITEM_BASE}/${base}.png`;
}
