#!/usr/bin/env tsx
/**
 * AI summary generator for the v3 Pokédex.
 *
 * Reads each Pokémon's pre-built bundle (or raw PokéAPI data as a fallback),
 * asks Anthropic's Claude to produce a 3-paragraph narration in English plus a
 * faithful French translation, and writes both locales to
 * `data_generated/summary/<id>_{en,fr}.txt`.
 *
 * See redo.md §9 for the full spec.
 */

import Anthropic from "@anthropic-ai/sdk";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import type { PokemonBundle, PokemonIndexBundle } from "../src/types/bundles";

/* -------------------------------------------------------------------------- */
/* Paths                                                                      */
/* -------------------------------------------------------------------------- */

const ROOT = process.cwd();
const BUNDLES_ROOT = resolve(ROOT, "public", "ui-data", "v1", "pokemon");
const BUNDLES_EN_DIR = join(BUNDLES_ROOT, "en");
const BUNDLES_EN_INDEX = join(BUNDLES_EN_DIR, "_index.json");
const API_ROOT = resolve(ROOT, "data", "api", "v2");
const OUT_DIR = resolve(ROOT, "data_generated", "summary");

/* -------------------------------------------------------------------------- */
/* Models                                                                     */
/* -------------------------------------------------------------------------- */

const DEFAULT_MODEL_ID = "claude-haiku-4-5-20251001";
const SONNET_MODEL_ID = "claude-sonnet-4-6";

function resolveModel(flag: string): string {
  if (flag === "sonnet" || flag === "Sonnet") return SONNET_MODEL_ID;
  if (flag === "haiku" || flag === "Haiku") return DEFAULT_MODEL_ID;
  return flag;
}

/* -------------------------------------------------------------------------- */
/* CLI args                                                                   */
/* -------------------------------------------------------------------------- */

type Args = {
  concurrency: number;
  force: boolean;
  model: string;
  only: Set<number> | null;
  limit: number | null;
  dryRun: boolean;
};

function parseArgs(argv: string[]): Args {
  const out: Args = {
    concurrency: 2,
    force: false,
    model: DEFAULT_MODEL_ID,
    only: null,
    limit: null,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--force") out.force = true;
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--concurrency") {
      const n = Number(argv[++i]);
      if (!Number.isFinite(n) || n < 1) throw new Error(`--concurrency expects a positive integer`);
      out.concurrency = Math.floor(n);
    } else if (a === "--model") {
      const m = argv[++i];
      if (!m) throw new Error("--model expects a value");
      out.model = resolveModel(m);
    } else if (a === "--only") {
      const raw = argv[++i] ?? "";
      const ids = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => {
          const n = Number(s);
          if (!Number.isFinite(n)) throw new Error(`--only expects comma-separated ids (got: ${s})`);
          return Math.floor(n);
        });
      out.only = new Set(ids);
    } else if (a === "--limit") {
      const n = Number(argv[++i]);
      if (!Number.isFinite(n) || n < 1) throw new Error(`--limit expects a positive integer`);
      out.limit = Math.floor(n);
    } else {
      throw new Error(`Unknown arg: ${a}`);
    }
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* ID discovery                                                               */
/* -------------------------------------------------------------------------- */

type IdEntry = { id: number; name: string; displayName: string };

type RawIndex = { count: number; results: Array<{ name: string; url: string }> };

function refId(url: string): number | null {
  const m = /\/(\d+)\/?$/.exec(url);
  if (!m) return null;
  return Number(m[1]);
}

function enumerateIds(): IdEntry[] {
  if (existsSync(BUNDLES_EN_INDEX)) {
    const data = JSON.parse(readFileSync(BUNDLES_EN_INDEX, "utf-8")) as PokemonIndexBundle;
    return data.entries
      .map((e) => ({ id: e.id, name: e.name, displayName: e.display_name }))
      .sort((a, b) => a.id - b.id);
  }
  const rawIndexPath = join(API_ROOT, "pokemon", "index.json");
  if (!existsSync(rawIndexPath)) {
    throw new Error(
      `No Pokémon index found. Expected either ${BUNDLES_EN_INDEX} (run "npm run bundles:build") or ${rawIndexPath}.`,
    );
  }
  const raw = JSON.parse(readFileSync(rawIndexPath, "utf-8")) as RawIndex;
  const out: IdEntry[] = [];
  for (const ref of raw.results) {
    const id = refId(ref.url);
    if (id == null) continue;
    out.push({ id, name: ref.name, displayName: titleCase(ref.name) });
  }
  return out.sort((a, b) => a.id - b.id);
}

/* -------------------------------------------------------------------------- */
/* Context building                                                           */
/* -------------------------------------------------------------------------- */

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function titleCase(name: string): string {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((p) => p[0]!.toUpperCase() + p.slice(1))
    .join(" ");
}

type RichContext = {
  name: string;
  displayName: string;
  id: number;
  richContext: string;
};

function readPokemonBundleIfAny(name: string): PokemonBundle | null {
  const p = join(BUNDLES_EN_DIR, `${name}.json`);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf-8")) as PokemonBundle;
  } catch {
    return null;
  }
}

type RawPokemon = {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: Array<{ type: { name: string } }>;
  stats: Array<{ base_stat: number; stat: { name: string } }>;
  abilities: Array<{ ability: { name: string }; is_hidden: boolean; slot: number }>;
  species: { url: string };
};

type RawSpecies = {
  id: number;
  name: string;
  color: { name: string } | null;
  shape: { name: string } | null;
  habitat: { name: string } | null;
  generation: { name: string };
  growth_rate: { name: string };
  egg_groups: Array<{ name: string }>;
  is_legendary: boolean;
  is_mythical: boolean;
  is_baby: boolean;
  genera: Array<{ genus: string; language: { name: string } }>;
  flavor_text_entries: Array<{
    flavor_text: string;
    language: { name: string };
  }>;
};

function readRawPokemon(id: number): { pokemon: RawPokemon; species: RawSpecies } | null {
  const pokePath = join(API_ROOT, "pokemon", String(id), "index.json");
  const spPath = join(API_ROOT, "pokemon-species", String(id), "index.json");
  if (!existsSync(pokePath) || !existsSync(spPath)) return null;
  try {
    const pokemon = JSON.parse(readFileSync(pokePath, "utf-8")) as RawPokemon;
    const species = JSON.parse(readFileSync(spPath, "utf-8")) as RawSpecies;
    return { pokemon, species };
  } catch {
    return null;
  }
}

function buildRichFromBundle(bundle: PokemonBundle): string {
  const sp = bundle.species;
  const types = bundle.types.map((t) => titleCase(t.name));
  const typeStr = types.length === 2 ? `${types[0]} / ${types[1]}` : (types[0] ?? "Unknown");

  const rarity: string[] = [];
  if (sp.is_legendary) rarity.push("Legendary");
  if (sp.is_mythical) rarity.push("Mythical");
  if (sp.is_baby) rarity.push("Baby Pokémon");

  const abilityLines = bundle.abilities.map((a) => {
    const tag = a.is_hidden ? " (hidden)" : "";
    const effect = stripHtml(a.short_effect_html) || "No effect listed.";
    return `- ${a.display_name}${tag}: ${effect}`;
  });

  const statLines = bundle.stats.map(
    (s) => `- ${titleCase(s.name)}: ${s.base_stat}`,
  );

  const weaknesses = new Set<string>();
  for (const def of bundle.defenders) {
    for (const w of def.double_damage_from) weaknesses.add(titleCase(w));
  }

  const flavor = stripHtml(sp.flavor_html);

  const lines: Array<string | null> = [
    `Name: ${bundle.display_name}`,
    `Dex number: ${bundle.id}`,
    `Slug: ${bundle.name}`,
    sp.genus ? `Category: ${sp.genus}` : null,
    `Type: ${typeStr}`,
    rarity.length ? `Rarity: ${rarity.join(", ")}` : null,
    `Generation: ${titleCase(sp.generation.replace(/^generation-/, ""))}`,
    sp.habitat ? `Habitat: ${titleCase(sp.habitat)}` : null,
    sp.shape ? `Shape: ${titleCase(sp.shape)}` : null,
    `Color: ${titleCase(sp.color)}`,
    sp.growth_rate ? `Growth rate: ${titleCase(sp.growth_rate)}` : null,
    sp.egg_groups.length ? `Egg groups: ${sp.egg_groups.map(titleCase).join(", ")}` : null,
    flavor ? `Pokédex entry: ${flavor}` : null,
    abilityLines.length ? `Abilities:\n${abilityLines.join("\n")}` : null,
    statLines.length ? `Base stats:\n${statLines.join("\n")}` : null,
    weaknesses.size ? `Weak to: ${[...weaknesses].join(", ")}` : null,
  ];

  return lines.filter((l): l is string => Boolean(l)).join("\n");
}

function buildRichFromRaw(id: number): RichContext | null {
  const raw = readRawPokemon(id);
  if (!raw) return null;
  const { pokemon, species } = raw;
  const types = pokemon.types.map((t) => titleCase(t.type.name));
  const typeStr = types.length === 2 ? `${types[0]} / ${types[1]}` : (types[0] ?? "Unknown");

  const en = (l: { name: string }) => l.name === "en";
  const genus = species.genera.find((g) => en(g.language))?.genus ?? "";
  const flavor = (
    species.flavor_text_entries.find((f) => en(f.language))?.flavor_text ?? ""
  ).replace(/[\f\n\r]+/g, " ").replace(/\s+/g, " ").trim();

  const rarity: string[] = [];
  if (species.is_legendary) rarity.push("Legendary");
  if (species.is_mythical) rarity.push("Mythical");
  if (species.is_baby) rarity.push("Baby Pokémon");

  const abilityLines = pokemon.abilities
    .sort((a, b) => a.slot - b.slot)
    .map((a) => `- ${titleCase(a.ability.name)}${a.is_hidden ? " (hidden)" : ""}`);

  const statLines = pokemon.stats.map(
    (s) => `- ${titleCase(s.stat.name)}: ${s.base_stat}`,
  );

  const displayName = titleCase(pokemon.name);
  const lines: Array<string | null> = [
    `Name: ${displayName}`,
    `Dex number: ${pokemon.id}`,
    `Slug: ${pokemon.name}`,
    genus ? `Category: ${genus}` : null,
    `Type: ${typeStr}`,
    rarity.length ? `Rarity: ${rarity.join(", ")}` : null,
    `Generation: ${titleCase(species.generation.name.replace(/^generation-/, ""))}`,
    species.habitat ? `Habitat: ${titleCase(species.habitat.name)}` : null,
    species.shape ? `Shape: ${titleCase(species.shape.name)}` : null,
    species.color ? `Color: ${titleCase(species.color.name)}` : null,
    species.growth_rate ? `Growth rate: ${titleCase(species.growth_rate.name)}` : null,
    species.egg_groups.length
      ? `Egg groups: ${species.egg_groups.map((g) => titleCase(g.name)).join(", ")}`
      : null,
    flavor ? `Pokédex entry: ${flavor}` : null,
    abilityLines.length ? `Abilities:\n${abilityLines.join("\n")}` : null,
    statLines.length ? `Base stats:\n${statLines.join("\n")}` : null,
  ];

  return {
    id: pokemon.id,
    name: pokemon.name,
    displayName,
    richContext: lines.filter((l): l is string => Boolean(l)).join("\n"),
  };
}

function buildContextForEntry(entry: IdEntry): RichContext | null {
  const bundle = readPokemonBundleIfAny(entry.name);
  if (bundle) {
    return {
      id: bundle.id,
      name: bundle.name,
      displayName: bundle.display_name,
      richContext: buildRichFromBundle(bundle),
    };
  }
  return buildRichFromRaw(entry.id);
}

/* -------------------------------------------------------------------------- */
/* Prompt                                                                     */
/* -------------------------------------------------------------------------- */

const SYSTEM_PROMPT = `You are a warm, knowledgeable Pokédex narrator. You write spoken-style prose meant to be read aloud by a text-to-speech engine. Your voice is second-person, present-tense, and friendly. You never use markdown, bullet lists, headings, or numerals; spell any small numbers out as words only when strictly necessary. You never wrap your output in quotes or preambles — you return only the two narrations separated by the required delimiters. You may use the web_search tool when available to double-check folklore, regional habitat, or design trivia, but you never cite URLs inside the prose.`;

function buildPrompt(ctx: RichContext): string {
  return `Here is the structured profile of a Pokémon:

${ctx.richContext}

Write two things:

1) An English narration of this Pokémon meant for a read-aloud Pokédex entry. Exactly three paragraphs, separated by single blank lines. Target length: between 320 and 400 words. Second person, present tense, natural spoken prose. Cover, in order: what the Pokémon is like and how fans recognise it (appearance, demeanour, its typing); its habitat, behaviour, and notable lore; and its abilities explained in plain language plus how its typing shapes its matchups in battle. Do not read any numeric stats aloud. No markdown, no bullet lists, no headings, no quotes, no preamble, no URLs.

2) A faithful French translation of the exact same narration, preserving the three-paragraph structure (same paragraph boundaries). The French version must read as natural spoken French, not a stiff machine translation, but it must cover the same facts and paragraph order as the English.

Emit your response in exactly this delimited format, with nothing before "--- EN ---" and nothing after "--- END ---":

--- EN ---
<English narration, three paragraphs separated by blank lines>
--- FR ---
<French narration, three paragraphs separated by blank lines>
--- END ---
`;
}

/* -------------------------------------------------------------------------- */
/* Response parsing                                                           */
/* -------------------------------------------------------------------------- */

function extractTextFromResponse(blocks: unknown): string {
  if (!Array.isArray(blocks)) return "";
  const parts: string[] = [];
  for (const b of blocks) {
    if (b && typeof b === "object") {
      const block = b as { type?: unknown; text?: unknown };
      if (block.type === "text" && typeof block.text === "string") {
        parts.push(block.text);
      }
    }
  }
  return parts.join("\n").trim();
}

type Parsed = { en: string; fr: string };

function parseDelimited(text: string): Parsed | null {
  const enStart = text.indexOf("--- EN ---");
  const frStart = text.indexOf("--- FR ---", enStart + 1);
  const endMark = text.indexOf("--- END ---", frStart + 1);
  if (enStart === -1 || frStart === -1 || endMark === -1) return null;
  const en = text.slice(enStart + "--- EN ---".length, frStart).trim();
  const fr = text.slice(frStart + "--- FR ---".length, endMark).trim();
  if (!en || !fr) return null;
  return { en, fr };
}

/* -------------------------------------------------------------------------- */
/* API call with retries                                                      */
/* -------------------------------------------------------------------------- */

type ApiResult =
  | { ok: true; text: string }
  | { ok: false; fatal: boolean; message: string };

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function shouldBackoff(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { status?: unknown; message?: unknown; error?: { type?: unknown } };
  if (e.status === 429 || e.status === 529 || e.status === 503) return true;
  const msg = typeof e.message === "string" ? e.message.toLowerCase() : "";
  if (/overloaded|rate[ -]?limit|too many requests/i.test(msg)) return true;
  const errType = e.error && typeof e.error === "object" ? (e.error.type as unknown) : undefined;
  if (typeof errType === "string" && /overloaded|rate_limit/i.test(errType)) return true;
  return false;
}

function isAuthError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { status?: unknown; message?: unknown };
  if (e.status === 401 || e.status === 403) return true;
  const msg = typeof e.message === "string" ? e.message : "";
  return /invalid[_ ]?api[_ ]?key|authentication|unauthor/i.test(msg);
}

type CreateArgs = Anthropic.MessageCreateParamsNonStreaming;

async function callAnthropic(
  client: Anthropic,
  model: string,
  prompt: string,
): Promise<ApiResult> {
  const baseArgs: CreateArgs = {
    model,
    max_tokens: 2000,
    temperature: 0.7,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  };
  // web_search tool (best-effort; not all Haiku variants expose it — fall back on 400).
  const webTool = {
    type: "web_search_20250305" as const,
    name: "web_search" as const,
    max_uses: 3,
  };

  const delays = [1000, 2000, 4000];
  let triedWithoutTools = false;

  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      const args: CreateArgs = triedWithoutTools
        ? baseArgs
        : { ...baseArgs, tools: [webTool] as CreateArgs["tools"] };
      const res: Anthropic.Message = await client.messages.create(args);
      const text = extractTextFromResponse(res.content as unknown);
      if (!text) {
        return { ok: false, fatal: true, message: "empty response" };
      }
      return { ok: true, text };
    } catch (err) {
      if (isAuthError(err)) {
        return { ok: false, fatal: true, message: `auth error: ${(err as Error).message}` };
      }
      // Tool-not-supported? Retry immediately without tools.
      const msg = err instanceof Error ? err.message : String(err);
      if (!triedWithoutTools && /tool|web_search|unsupported|unknown parameter/i.test(msg)) {
        triedWithoutTools = true;
        continue;
      }
      if (shouldBackoff(err) && attempt < delays.length) {
        await sleep(delays[attempt]!);
        continue;
      }
      return { ok: false, fatal: false, message: msg };
    }
  }
  return { ok: false, fatal: false, message: "retries exhausted" };
}

/* -------------------------------------------------------------------------- */
/* Output                                                                     */
/* -------------------------------------------------------------------------- */

function outPath(id: number, lang: "en" | "fr"): string {
  return join(OUT_DIR, `${id}_${lang}.txt`);
}

function writeAtomic(path: string, body: string): void {
  mkdirSync(OUT_DIR, { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, body, "utf-8");
  renameSync(tmp, path);
}

function bothExist(id: number): boolean {
  return existsSync(outPath(id, "en")) && existsSync(outPath(id, "fr"));
}

/* -------------------------------------------------------------------------- */
/* Concurrency                                                                */
/* -------------------------------------------------------------------------- */

type Outcome = "written" | "skipped" | "failed";

async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<Outcome>,
): Promise<Outcome[]> {
  const results: Outcome[] = Array.from({ length: items.length });
  let cursor = 0;
  async function loop(): Promise<void> {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await worker(items[i]!, i);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, Math.max(1, items.length)) }, () =>
    loop(),
  );
  await Promise.all(workers);
  return results;
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const allEntries = enumerateIds();
  let entries = allEntries;
  if (args.only) {
    const wanted = args.only;
    entries = entries.filter((e) => wanted.has(e.id));
  }
  if (args.limit != null) {
    entries = entries.slice(0, args.limit);
  }

  if (entries.length === 0) {
    process.stdout.write("No Pokémon match the given filters. Nothing to do.\n");
    return;
  }

  mkdirSync(OUT_DIR, { recursive: true });

  /* ---- dry run ---- */
  if (args.dryRun) {
    const first = entries[0]!;
    const ctx = buildContextForEntry(first);
    if (!ctx) {
      process.stdout.write(
        `[dry-run] no data available for id=${first.id} (${first.name}). Run "npm run bundles:build" or "npm run data:sync" first.\n`,
      );
      return;
    }
    const prompt = buildPrompt(ctx);
    process.stdout.write(
      `[dry-run] model=${args.model} concurrency=${args.concurrency} force=${args.force}\n` +
        `[dry-run] first Pokémon: ${ctx.displayName} (id=${ctx.id}, slug=${ctx.name})\n` +
        `[dry-run] system prompt (${SYSTEM_PROMPT.length} chars):\n${SYSTEM_PROMPT}\n` +
        `[dry-run] user prompt (${prompt.length} chars):\n${prompt}\n`,
    );
    return;
  }

  /* ---- API key check ---- */
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    process.stdout.write("Set ANTHROPIC_API_KEY to run. Skipping.\n");
    process.exit(0);
  }

  const client = new Anthropic();

  let written = 0;
  let skipped = 0;
  let failed = 0;
  const total = entries.length;

  await runPool(entries, args.concurrency, async (entry, i) => {
    const idx = i + 1;
    if (!args.force && bothExist(entry.id)) {
      skipped++;
      process.stdout.write(`[${idx}/${total}] ${entry.name} — skipped (both locales exist)\n`);
      return "skipped";
    }
    const ctx = buildContextForEntry(entry);
    if (!ctx) {
      failed++;
      process.stdout.write(
        `[${idx}/${total}] ${entry.name} — no data available (run bundles:build or data:sync); skip\n`,
      );
      return "failed";
    }
    const prompt = buildPrompt(ctx);
    const result = await callAnthropic(client, args.model, prompt);
    if (!result.ok) {
      if (result.fatal && /auth error/i.test(result.message)) {
        process.stderr.write(`FATAL auth error: ${result.message}\n`);
        process.exit(1);
      }
      failed++;
      process.stdout.write(
        `[${idx}/${total}] ${entry.name} — API error: ${result.message}\n`,
      );
      return "failed";
    }
    const parsed = parseDelimited(result.text);
    if (!parsed) {
      failed++;
      process.stdout.write(
        `[${idx}/${total}] ${entry.name} — malformed response (missing delimiters); skip\n`,
      );
      return "failed";
    }
    try {
      writeAtomic(outPath(entry.id, "en"), parsed.en + "\n");
      writeAtomic(outPath(entry.id, "fr"), parsed.fr + "\n");
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      process.stdout.write(`[${idx}/${total}] ${entry.name} — write failed: ${msg}\n`);
      return "failed";
    }
    written++;
    process.stdout.write(`[${idx}/${total}] ${entry.name} — EN ok, FR ok\n`);
    return "written";
  });

  process.stdout.write(
    `\nDone. written=${written} skipped=${skipped} failed=${failed} total=${total}\n`,
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
