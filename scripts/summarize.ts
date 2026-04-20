// Generate human-readable Pokémon summaries with the Claude Code CLI and save
// them to data_generated/summary/<id>_en.txt. Layout mirrors the ergonomics of
// data/api/v2 (id-keyed, one file per record); commits get checked in so future
// site builds ship the text without re-invoking the model.
//
// Prerequisites: `npm run bundles:build` (reads public/bundles/…), `claude`
// CLI on PATH (uses your existing subscription via keychain auth).
//
// Behavior:
// - English only for now; files are written as <id>_en.txt (the trailing
//   `_en` leaves the door open for per-language siblings later).
// - Without `--limit`, iterates the full pending queue. Idempotent: each run
//   skips pokemon whose summary already exists, so you can re-invoke to
//   resume from wherever the last run stopped.
// - On a rate-limit / quota-exhausted response from the CLI, the script
//   logs a friendly message and exits 0 (no traceback).
// - `--concurrency N` fans out N concurrent CLI invocations. 2 by default
//   (matches the npm script default).
//
// Examples:
//   npm run summaries:build                         # go until rate-limited or done
//   npm run summaries:build -- --concurrency 4      # 4 in parallel
//   npm run summaries:build -- --only bulbasaur     # single pokemon
//   npm run summaries:build -- --limit 5            # cap this run at 5
//   npm run summaries:build -- --force --only mew   # overwrite existing
//   npm run summaries:build -- --model sonnet       # bigger model

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ROOT } from "./lib/io.ts";
import type { AbilityBundle, PokemonBundle, PokemonIndexBundle } from "~/types/bundles";

const BUNDLES = resolve(ROOT, "public/bundles");
const SUMMARIES = resolve(ROOT, "data_generated/summary");
const SUMMARY_LANG = "en";
const DEFAULT_MODEL = "haiku";
const DEFAULT_CONCURRENCY = 2;

// Patterns we treat as "stop, the user is out of quota — don't retry, don't
// noise the log, just exit cleanly so the next run resumes."
const RATE_LIMIT_PATTERNS = [
  /usage limit/i,
  /rate[ -]?limit/i,
  /\b5[ -]?hour\b/i,
  /quota/i,
  /credit balance/i,
  /too many requests/i,
  /\b429\b/,
  /overloaded/i,
  /exceeded/i,
];

type Args = {
  only: Set<string> | null;
  force: boolean;
  limit: number | null;
  model: string;
  concurrency: number;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const out: Args = {
    only: null,
    force: false,
    limit: null,
    model: DEFAULT_MODEL,
    concurrency: DEFAULT_CONCURRENCY,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--force") out.force = true;
    else if (a === "--only") out.only = new Set((argv[++i] ?? "").split(",").map((s) => s.trim()));
    else if (a === "--limit") out.limit = Number(argv[++i]);
    else if (a === "--model") out.model = argv[++i] ?? DEFAULT_MODEL;
    else if (a === "--concurrency") out.concurrency = Math.max(1, Number(argv[++i]));
    else throw new Error(`Unknown arg: ${a}`);
  }
  return out;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

function titleCase(name: string): string {
  return name
    .split(/[-_\s]/)
    .filter(Boolean)
    .map((p) => p[0]!.toUpperCase() + p.slice(1))
    .join(" ");
}

function buildPrompt(poke: PokemonBundle, abilities: AbilityBundle[]): string {
  const types = poke.types.map((t) => titleCase(t.name));
  const typeStr = types.length === 2 ? `${types[0]} / ${types[1]}` : types[0] ?? "Unknown";
  const rarity: string[] = [];
  if (poke.species.is_legendary) rarity.push("Legendary");
  if (poke.species.is_mythical) rarity.push("Mythical");
  if (poke.species.is_baby) rarity.push("Baby Pokémon");

  const abilityLines = abilities.map((a) => {
    const tag = poke.abilities.find((pa) => pa.name === a.name)?.is_hidden ? " (hidden)" : "";
    const effect = a.short_effect ?? a.effect ?? "—";
    return `- ${a.display_name}${tag}: ${effect}`;
  });

  const weaknesses = new Set<string>();
  for (const def of poke.defenders) {
    for (const w of def.double_damage_from) weaknesses.add(titleCase(w));
  }

  const facts = [
    `Name: ${titleCase(poke.name)}`,
    `Dex number: ${poke.id}`,
    `Category: ${poke.species.genus ?? "Pokémon"}`,
    `Type: ${typeStr}`,
    rarity.length ? `Rarity: ${rarity.join(", ")}` : null,
    poke.species.habitat ? `Habitat: ${titleCase(poke.species.habitat)}` : null,
    poke.species.shape ? `Shape: ${titleCase(poke.species.shape)}` : null,
    `Color: ${titleCase(poke.species.color)}`,
    poke.species.flavor ? `Dex entry: ${poke.species.flavor}` : null,
    abilityLines.length ? `Abilities:\n${abilityLines.join("\n")}` : null,
    weaknesses.size ? `Weak to: ${[...weaknesses].join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `You are a friendly Pokédex narrator. Given the structured data below, write an engaging spoken-style summary of this Pokémon for a fan audience listening through a Pokédex app.

Requirements:
- Three paragraphs, separated by single blank lines.
- Target length 320–400 words — roughly 2 to 3 minutes of listening at a natural narration pace. Do not pad; every sentence should add something.
- Present tense, natural prose, no bullet lists, no markdown, no headings.
- Cover: what the Pokémon is like and how fans recognise it; its habitat, behaviour, and notable lore or dex-entry details; and its abilities (explain what each does in plain language) plus how its typing shapes its matchups in battle.
- Do not read numerical stats aloud.
- Do not wrap the output in quotes or say "Here is a summary" — output only the summary prose.

DATA:
${facts}
`;
}

type ClaudeResult =
  | { ok: true; text: string }
  | { ok: false; rateLimited: boolean; message: string };

function runClaude(prompt: string, model: string): Promise<ClaudeResult> {
  return new Promise((resolvePromise) => {
    const child = spawn("claude", ["-p", "--model", model, prompt], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d: Buffer) => {
      stderr += d.toString();
    });
    child.on("error", (err) => {
      resolvePromise({ ok: false, rateLimited: false, message: err.message });
    });
    child.on("close", (code) => {
      const trimmed = stdout.trim();
      const combined = `${stdout}\n${stderr}`;
      const looksRateLimited = RATE_LIMIT_PATTERNS.some((p) => p.test(combined));

      if (code === 0 && trimmed && !looksRateLimited) {
        resolvePromise({ ok: true, text: trimmed });
        return;
      }
      resolvePromise({
        ok: false,
        rateLimited: looksRateLimited,
        message:
          (stderr.trim() || trimmed || `claude exited ${code ?? "null"}`).slice(0, 400) +
          ((stderr.length || trimmed.length) > 400 ? "…" : ""),
      });
    });
  });
}

async function summariseOne(
  entry: { name: string; id: number },
  model: string,
): Promise<"ok" | "fail" | "stop"> {
  const pokePath = resolve(BUNDLES, `pokemon/${entry.name}.json`);
  if (!existsSync(pokePath)) {
    console.warn(`  skip ${entry.name} — bundle missing`);
    return "fail";
  }
  const poke = readJson<PokemonBundle>(pokePath);
  const abilities: AbilityBundle[] = [];
  for (const a of poke.abilities) {
    const abilityPath = resolve(BUNDLES, `ability/${a.name}.json`);
    if (existsSync(abilityPath)) abilities.push(readJson<AbilityBundle>(abilityPath));
  }

  const prompt = buildPrompt(poke, abilities);
  const started = Date.now();
  const result = await runClaude(prompt, model);
  const secs = ((Date.now() - started) / 1000).toFixed(1);

  if (result.ok) {
    writeFileSync(
      resolve(SUMMARIES, `${entry.id}_${SUMMARY_LANG}.txt`),
      result.text + "\n",
      "utf-8",
    );
    return "ok";
  }
  if (result.rateLimited) {
    console.log(`\n  ⟋ rate-limited while summarising ${entry.name} (${secs}s):`);
    console.log(`    ${result.message}`);
    return "stop";
  }
  console.error(`  ✗ ${entry.name} (${secs}s): ${result.message}`);
  return "fail";
}

async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, i: number) => Promise<"ok" | "fail" | "stop">,
  onProgress: (result: "ok" | "fail" | "stop", item: T, i: number) => void,
): Promise<boolean> {
  let cursor = 0;
  let stopped = false;
  async function loop() {
    while (!stopped) {
      const i = cursor++;
      if (i >= items.length) return;
      const item = items[i]!;
      const result = await worker(item, i);
      if (result === "stop") {
        stopped = true;
      }
      onProgress(result, item, i);
      if (result === "stop") return;
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => loop()));
  return stopped;
}

async function main() {
  const args = parseArgs();
  mkdirSync(SUMMARIES, { recursive: true });

  const indexPath = resolve(BUNDLES, "pokemon/_index.json");
  if (!existsSync(indexPath)) {
    throw new Error(
      `Missing ${indexPath}. Run \`npm run bundles:build\` before summarising.`,
    );
  }
  const index = readJson<PokemonIndexBundle>(indexPath);

  let targets = index.entries;
  if (args.only) targets = targets.filter((e) => args.only!.has(e.name));
  const pending = targets.filter((e) => {
    const path = resolve(SUMMARIES, `${e.id}_${SUMMARY_LANG}.txt`);
    return args.force || !existsSync(path);
  });
  const queue = args.limit !== null ? pending.slice(0, args.limit) : pending;

  console.log(
    `Pokémon to summarise: ${queue.length} (of ${pending.length} pending, ${targets.length} in scope, ${index.entries.length} total)`,
  );
  if (queue.length === 0) return;
  console.log(`Model: ${args.model} · Concurrency: ${args.concurrency}\n`);

  let done = 0;
  let failed = 0;
  const startedAt = Date.now();

  const stopped = await runPool(
    queue,
    args.concurrency,
    (entry) => summariseOne(entry, args.model),
    (result, entry) => {
      if (result === "ok") {
        done++;
        console.log(`  [${done}/${queue.length}] ${entry.name} ✓`);
      } else if (result === "fail") {
        failed++;
      }
    },
  );

  const totalSecs = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(
    `\n${stopped ? "Stopped (rate-limited)" : "Done"} in ${totalSecs}s. Generated ${done}, failed ${failed}, remaining ${queue.length - done - failed}.`,
  );
  if (stopped) {
    console.log("Re-run `npm run summaries:build` later — it will pick up where this left off.");
  }
  // Exit 0 for normal finish AND for rate-limit (since rate-limit is expected
  // and the script is idempotent). Only exit 1 if *every* attempt failed for a
  // reason other than rate-limit — that's a sign something is actually broken.
  if (!stopped && done === 0 && failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
