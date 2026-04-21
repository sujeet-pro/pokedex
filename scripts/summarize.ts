#!/usr/bin/env tsx
/**
 * AI summary generator for the v3 Pokédex.
 *
 * Reads each Pokémon's pre-built bundle (or raw PokéAPI data as a fallback),
 * asks the local `claude` CLI (Claude Code) to produce a 5-paragraph 3-to-5
 * minute narration in English plus a faithful Spanish translation, and writes
 * both locales to `data_generated/summary/<id>_{en,es}.txt`.
 *
 * Uses the `claude --print` non-interactive mode, so no ANTHROPIC_API_KEY is
 * required — it relies on the credentials your local Claude Code session is
 * already using.
 */

import { spawn } from "node:child_process";
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

// Claude CLI defaults to the configured model unless `--model` is passed.
// "" means "let Claude CLI decide" (i.e. use whatever the user has set up).
const DEFAULT_MODEL_ID = "";

function resolveModel(flag: string): string {
  // Friendly aliases — the CLI accepts "haiku"/"sonnet"/"opus" too, but the
  // exact id makes intent explicit in the dry-run dump.
  if (flag === "sonnet" || flag === "Sonnet") return "claude-sonnet-4-6";
  if (flag === "haiku" || flag === "Haiku") return "claude-haiku-4-5";
  if (flag === "opus" || flag === "Opus") return "claude-opus-4-7";
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
  target: number | null;
  dryRun: boolean;
};

function parseArgs(argv: string[]): Args {
  const out: Args = {
    concurrency: 2,
    force: false,
    model: DEFAULT_MODEL_ID,
    only: null,
    limit: null,
    target: null,
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
    } else if (a === "--target") {
      const n = Number(argv[++i]);
      if (!Number.isFinite(n) || n < 1) throw new Error(`--target expects a positive integer`);
      out.target = Math.floor(n);
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

const SYSTEM_PROMPT = `You are a knowledgeable, factual Pokédex narrator writing informational prose meant to be read aloud by a text-to-speech engine for three to five minutes per Pokémon. Your voice is neutral third person, present tense, clear and encyclopedic. You convey what the Pokémon is, what it does, where it is found, how it behaves, how it fights, and how it fits into its evolutionary line — all in flowing paragraphs, not lists. You never use markdown, bullet lists, headings, numerals, parentheses, em-dash sequences, or quoted speech; you spell any unavoidable small numbers out as words. You do not wrap your output in quotes or preambles — you return only the two narrations separated by the required delimiters. You may use the web_search tool when available to double-check regional habitat, ability behaviour, or design origin, but you never cite URLs inside the prose.`;

function buildPrompt(ctx: RichContext): string {
  return `Here is the structured profile of a Pokémon:

${ctx.richContext}

Write two things:

1) An English informational Pokédex narration meant for a three-to-five-minute read-aloud entry. Target length: between six hundred and eight hundred words, in exactly five paragraphs separated by single blank lines. Use neutral third person and present tense, writing clear factual prose that reads naturally aloud. The five paragraphs, in order, must cover:
   • Identity — what this Pokémon is: species category, primary and secondary typing, generation of origin, physical description (silhouette, colouring, size and build relative to a human), and any defining feature such as an organ, crest, tail shape, or signature marking.
   • Habitat and range — where it lives in the world: regions, biomes, climate, typical locations, how population density varies, whether it is solitary or social, and any migration or time-of-day pattern worth noting.
   • Behaviour and diet — what it does day to day: sleep/wake cycle, feeding habits, communication, temperament toward humans and other Pokémon, notable instincts, mating or nesting behaviour, any folklore or field lore trainers report.
   • Abilities and battle role — what it can do in combat: its standard and hidden abilities explained in plain language (what each ability actually does), what its typing means for offensive and defensive matchups, its speed and physical or special leanings, and the situations in which it excels or struggles.
   • Evolution and significance — where it sits in its evolutionary line, what it evolves from and into with the method (level, stone, trade, happiness, etc.), its place in the wider Pokédex, and a closing factual note on why trainers and researchers care about this species.
Do not read any numeric stats, percentages, or dex numbers aloud. No markdown, no bullet lists, no headings, no quotes, no preamble, no URLs.

2) A faithful Spanish translation of the exact same narration, preserving the five-paragraph structure (same paragraph boundaries, same target length of six hundred to eight hundred Spanish words). The Spanish version must read as natural spoken Spanish, not a stiff machine translation, but it must cover the same facts and paragraph order as the English.

Emit your response in exactly this delimited format, with nothing before "--- EN ---" and nothing after "--- END ---":

--- EN ---
<English narration, five paragraphs separated by blank lines>
--- ES ---
<Spanish narration, five paragraphs separated by blank lines>
--- END ---
`;
}

/* -------------------------------------------------------------------------- */
/* Response parsing                                                           */
/* -------------------------------------------------------------------------- */

type Parsed = { en: string; es: string };

function parseDelimited(text: string): Parsed | null {
  const enStart = text.indexOf("--- EN ---");
  const esStart = text.indexOf("--- ES ---", enStart + 1);
  const endMark = text.indexOf("--- END ---", esStart + 1);
  if (enStart === -1 || esStart === -1 || endMark === -1) return null;
  const en = text.slice(enStart + "--- EN ---".length, esStart).trim();
  const es = text.slice(esStart + "--- ES ---".length, endMark).trim();
  if (!en || !es) return null;
  return { en, es };
}

/* -------------------------------------------------------------------------- */
/* Claude Code CLI invocation                                                 */
/* -------------------------------------------------------------------------- */

type CliResult =
  | { ok: true; text: string }
  | { ok: false; fatal: boolean; message: string };

/**
 * Spawn `claude --print` in non-interactive mode, push the user prompt as a
 * positional argument, and append the storyteller system prompt. The CLI
 * inherits whatever credentials the local Claude Code session is using.
 */
async function callClaudeCli(
  userPrompt: string,
  systemPrompt: string,
  model: string,
): Promise<CliResult> {
  const args: string[] = ["--print", userPrompt, "--append-system-prompt", systemPrompt];
  if (model) args.push("--model", model);

  return new Promise((resolveResult) => {
    let proc: ReturnType<typeof spawn>;
    try {
      proc = spawn("claude", args, { stdio: ["ignore", "pipe", "pipe"] });
    } catch (err) {
      resolveResult({
        ok: false,
        fatal: true,
        message: `cannot spawn claude: ${err instanceof Error ? err.message : String(err)}`,
      });
      return;
    }

    let stdout = "";
    let stderr = "";
    proc.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf-8");
    });
    proc.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf-8");
    });
    proc.on("error", (err) => {
      resolveResult({
        ok: false,
        fatal: true,
        message: `cannot spawn claude (${err.message}). Install Claude Code: https://claude.com/code`,
      });
    });
    proc.on("close", (code) => {
      const text = stdout.trim();
      if (code === 0 && text.length > 0) {
        resolveResult({ ok: true, text });
        return;
      }
      const errMsg = stderr.trim() || "no stderr output";
      resolveResult({
        ok: false,
        fatal: code === 127,
        message: `claude exit ${code}: ${errMsg}`,
      });
    });
  });
}

/* -------------------------------------------------------------------------- */
/* Output                                                                     */
/* -------------------------------------------------------------------------- */

function outPath(id: number, lang: "en" | "es"): string {
  return join(OUT_DIR, `${id}_${lang}.txt`);
}

function writeAtomic(path: string, body: string): void {
  mkdirSync(OUT_DIR, { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, body, "utf-8");
  renameSync(tmp, path);
}

function bothExist(id: number): boolean {
  return existsSync(outPath(id, "en")) && existsSync(outPath(id, "es"));
}

/* -------------------------------------------------------------------------- */
/* Concurrency                                                                */
/* -------------------------------------------------------------------------- */

type Outcome = "written" | "skipped" | "failed";

async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<Outcome>,
  shouldStop?: () => boolean,
): Promise<Outcome[]> {
  const results: Outcome[] = Array.from({ length: items.length });
  let cursor = 0;
  async function loop(): Promise<void> {
    while (true) {
      if (shouldStop?.()) return;
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
    const modelLabel = args.model || "(claude CLI default)";
    process.stdout.write(
      `[dry-run] transport=claude-cli model=${modelLabel} concurrency=${args.concurrency} force=${args.force}\n` +
        `[dry-run] first Pokémon: ${ctx.displayName} (id=${ctx.id}, slug=${ctx.name})\n` +
        `[dry-run] system prompt (${SYSTEM_PROMPT.length} chars):\n${SYSTEM_PROMPT}\n` +
        `[dry-run] user prompt (${prompt.length} chars):\n${prompt}\n`,
    );
    return;
  }

  let written = 0;
  let skipped = 0;
  let failed = 0;
  const total = entries.length;
  const target = args.target;
  // When `--target N` is set: skipped entries don't count toward N; we walk
  // the id list forward and only stop once `written` reaches N. Workers that
  // are mid-generation when the target is hit still finish (the claude call
  // has already been paid for), so final `written` may exceed N by up to
  // concurrency-1. That's deliberate — correctness over pedantry.
  const progressLabel = (): string =>
    target != null ? `${written}/${target} new` : `${written + skipped + failed}/${total}`;

  await runPool(
    entries,
    args.concurrency,
    async (entry, i) => {
      const idx = i + 1;
      // Skipped-for-existing: does NOT count toward --target.
      if (!args.force && bothExist(entry.id)) {
        skipped++;
        process.stdout.write(
          `[${progressLabel()}] ${entry.name} (id ${entry.id}) — skipped (both locales exist)\n`,
        );
        return "skipped";
      }
      // Bail before starting a fresh generation if we've already hit target.
      if (target != null && written >= target) {
        return "skipped";
      }
      const ctx = buildContextForEntry(entry);
      if (!ctx) {
        failed++;
        process.stdout.write(
          `[${progressLabel()}] ${entry.name} (id ${entry.id}) — no data available (run bundles:build or data:sync); skip\n`,
        );
        return "failed";
      }
      const prompt = buildPrompt(ctx);
      const result = await callClaudeCli(prompt, SYSTEM_PROMPT, args.model);
      if (!result.ok) {
        if (result.fatal) {
          process.stderr.write(`FATAL: ${result.message}\n`);
          process.exit(1);
        }
        failed++;
        process.stdout.write(
          `[${progressLabel()}] ${entry.name} (id ${entry.id}) — claude error: ${result.message}\n`,
        );
        return "failed";
      }
      const parsed = parseDelimited(result.text);
      if (!parsed) {
        failed++;
        process.stdout.write(
          `[${progressLabel()}] ${entry.name} (id ${entry.id}) — malformed response (missing delimiters); skip\n`,
        );
        return "failed";
      }
      try {
        writeAtomic(outPath(entry.id, "en"), parsed.en + "\n");
        writeAtomic(outPath(entry.id, "es"), parsed.es + "\n");
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        process.stdout.write(
          `[${progressLabel()}] ${entry.name} (id ${entry.id}) — write failed: ${msg}\n`,
        );
        return "failed";
      }
      written++;
      process.stdout.write(
        `[${progressLabel()}] ${entry.name} (id ${entry.id}) — EN ok, ES ok\n`,
      );
      return "written";
    },
    () => target != null && written >= target,
  );

  process.stdout.write(
    `\nDone. written=${written} skipped=${skipped} failed=${failed}${
      target != null ? ` target=${target}` : ` total=${total}`
    }\n`,
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
