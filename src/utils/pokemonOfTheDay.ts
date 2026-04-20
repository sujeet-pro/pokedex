const GEN_COUNT = 1025;

export function pokemonOfTheDayId(date = new Date()): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const seed = y * 10000 + m * 100 + d;
  // Mulberry32-ish hash -> stable per-day pick
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const rand = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return Math.floor(rand * GEN_COUNT) + 1;
}
