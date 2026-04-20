const ARTWORK_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";

const PIXEL_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

/** Official artwork URL (pretty, high-res). Preferred for cards and detail hero. */
export function pokemonArtwork(id: number): string {
  return `${ARTWORK_BASE}/${id}.png`;
}

/** Pixelated sprite URL. Used only as a legacy fallback. */
export function pokemonPixelSprite(id: number): string {
  return `${PIXEL_BASE}/${id}.png`;
}
