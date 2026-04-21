#!/usr/bin/env tsx
/**
 * Post-build step: copy the prerendered root index.html to 404.html so that
 * GitHub Pages serves the SPA bootstrap for any unmatched path. The single
 * JS bundle contains both en/es translations, so the client router reads
 * `window.location.pathname`, detects the intended locale, and renders the
 * matching route (or the in-app not-found page for truly invalid URLs).
 */
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const src = join(root, "dist", "client", "index.html");
const dst = join(root, "dist", "client", "404.html");

if (!existsSync(src)) {
  process.stderr.write(`postbuild: ${src} not found — run "vite build" first\n`);
  process.exit(1);
}

copyFileSync(src, dst);
process.stdout.write(`postbuild: wrote ${dst}\n`);
