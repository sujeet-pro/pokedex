import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DATA_ROOT = resolve(ROOT, "data/api/v2");
export const OUT_ROOT = resolve(ROOT, "public/bundles");

// Read a record keyed by path like "pokemon/1" or "pokemon-species/bulbasaur".
// PokeAPI url refs look like "/api/v2/pokemon-species/1/" — call resolveRef()
// for those and this for everything else.
export function readRecord<T>(resourcePath: string): T {
  const full = resolve(DATA_ROOT, resourcePath, "index.json");
  if (!existsSync(full)) {
    throw new Error(`Missing data file: ${full}`);
  }
  return JSON.parse(readFileSync(full, "utf-8")) as T;
}

// Turn "/api/v2/pokemon-species/1/" into { resource: "pokemon-species", id: "1" }.
// Also accepts the absolute https://pokeapi.co/api/v2/... form (a few records
// still carry it, particularly evolution-chain URLs inside species).
export function parseRef(url: string): { resource: string; id: string } {
  const m = url.match(/\/api\/v2\/([^/]+)\/([^/]+)\/?$/);
  if (!m) throw new Error(`Unrecognised ref url: ${url}`);
  return { resource: m[1]!, id: m[2]! };
}

export function readRef<T>(url: string): T {
  const { resource, id } = parseRef(url);
  return readRecord<T>(`${resource}/${id}`);
}

export function idFromRef(url: string): number {
  const { id } = parseRef(url);
  const n = Number(id);
  if (Number.isNaN(n)) throw new Error(`Non-numeric id in ref ${url}`);
  return n;
}

export function writeBundle(rel: string, value: unknown) {
  const full = resolve(OUT_ROOT, rel);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, JSON.stringify(value));
}
