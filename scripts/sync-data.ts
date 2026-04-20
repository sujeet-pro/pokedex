// Populate data/ with a mirror of PokeAPI/api-data — the upstream repo keeps
// every endpoint as data/api/v2/<resource>/<id>/index.json (plus <resource>/index.json
// listings). We fetch it into .cache/ (full clone, with history), then copy
// just the data/api tree into our data/ folder without any nested .git.
//
// Run with `npm run data:sync`. Incremental on subsequent runs.

import { execSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = "https://github.com/PokeAPI/api-data.git";
const REPO_DIR = ".cache/pokeapi-api-data";
const SRC_SUBPATH = "data/api"; // inside the cloned repo
const DEST_DIR = "data/api"; // in this project

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoPath = resolve(ROOT, REPO_DIR);
const destPath = resolve(ROOT, DEST_DIR);

function run(cmd: string, cwd?: string) {
  console.log(`$ ${cmd}${cwd ? ` (cwd=${cwd})` : ""}`);
  execSync(cmd, { cwd: cwd ?? ROOT, stdio: "inherit" });
}

function isGitRepo(dir: string): boolean {
  if (!existsSync(dir)) return false;
  const gitDir = resolve(dir, ".git");
  return existsSync(gitDir);
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const force = args.has("--force");

  if (force && existsSync(repoPath)) {
    console.log(`Removing ${REPO_DIR} (--force)…`);
    rmSync(repoPath, { recursive: true, force: true });
  }

  mkdirSync(resolve(ROOT, ".cache"), { recursive: true });

  if (isGitRepo(repoPath)) {
    console.log(`Updating existing clone in ${REPO_DIR}…`);
    // fetch + reset keeps things lean vs pull w/ merge
    run("git fetch --depth=1 origin master", repoPath);
    run("git reset --hard origin/master", repoPath);
  } else {
    if (existsSync(repoPath)) {
      console.log(`Removing non-repo ${REPO_DIR}…`);
      rmSync(repoPath, { recursive: true, force: true });
    }
    console.log("Cloning PokeAPI/api-data (shallow)…");
    run(`git clone --depth=1 ${REPO} ${REPO_DIR}`);
  }

  const srcPath = resolve(repoPath, SRC_SUBPATH);
  if (!existsSync(srcPath)) {
    throw new Error(`Expected ${srcPath} after clone, but it's missing.`);
  }

  console.log(`Syncing ${SRC_SUBPATH} → ${DEST_DIR}…`);
  if (existsSync(destPath)) rmSync(destPath, { recursive: true, force: true });
  mkdirSync(dirname(destPath), { recursive: true });

  // Prefer rsync if available (big speed win on refresh); fall back to cpSync.
  const rsync = spawnSync("rsync", ["--version"], { stdio: "ignore" });
  if (rsync.status === 0) {
    run(`rsync -a --delete "${srcPath}/" "${destPath}/"`);
  } else {
    cpSync(srcPath, destPath, { recursive: true });
  }

  const probe = resolve(destPath, "v2/pokemon/1/index.json");
  if (!existsSync(probe)) {
    throw new Error(`Verification failed: ${probe} not found after sync.`);
  }

  const size = statSync(destPath);
  console.log(`\nDone. ${DEST_DIR}/ populated (root inode ${size.ino}).`);
  console.log("Try: ls data/api/v2 | head");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
