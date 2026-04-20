import { join } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import type { Locale } from "../../src/types/locales";
import { escapeHtml } from "./localize";

const SUMMARY_ROOT = join(process.cwd(), "data_generated", "summary");

export function readSummaryHtml(id: number, lang: Locale): string | null {
  const path = join(SUMMARY_ROOT, `${id}_${lang}.txt`);
  if (!existsSync(path)) return null;
  const text = readFileSync(path, "utf-8");
  if (!text.trim()) return null;
  return wrapWordsAsSpans(text);
}

// Wrap every whitespace-separated word in <span data-w="<char-offset>"> tokens.
// Whitespace is preserved between tokens.
function wrapWordsAsSpans(text: string): string {
  const tokens: string[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i]!;
    if (/\s/.test(ch)) {
      let j = i;
      while (j < text.length && /\s/.test(text[j]!)) j++;
      tokens.push(text.slice(i, j));
      i = j;
    } else {
      const start = i;
      while (i < text.length && !/\s/.test(text[i]!)) i++;
      const word = text.slice(start, i);
      tokens.push(`<span data-w="${start}">${escapeHtml(word)}</span>`);
    }
  }
  return tokens.join("");
}
