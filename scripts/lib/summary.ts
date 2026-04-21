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
  return wrapTextAsHtml(text);
}

/**
 * Split the source text on blank lines into paragraphs, wrap each paragraph
 * in `<p>…</p>`, and tokenise words inside as `<span data-w="<char-offset>">`.
 * `data-w` is the offset into the *original* source text; the SpeakButton
 * binary-searches these against the `charIndex` the TTS engine emits on its
 * boundary events. A literal `\n` between `<p>` elements keeps paragraphs
 * separated by a single space after `DOMParser.textContent` + whitespace
 * collapse, which matches the engine's idea of a word break.
 */
function wrapTextAsHtml(text: string): string {
  const out: string[] = [];
  const re = /\n\s*\n/g;
  let start = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const para = text.slice(start, m.index);
    if (para.trim().length > 0) {
      out.push(`<p>${wrapWordsAsSpans(para, start)}</p>`);
    }
    start = m.index + m[0].length;
  }
  const tail = text.slice(start);
  if (tail.trim().length > 0) {
    out.push(`<p>${wrapWordsAsSpans(tail, start)}</p>`);
  }
  return out.join("\n");
}

function wrapWordsAsSpans(text: string, baseOffset: number): string {
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
      const wordStart = i;
      while (i < text.length && !/\s/.test(text[i]!)) i++;
      const word = text.slice(wordStart, i);
      tokens.push(`<span data-w="${baseOffset + wordStart}">${escapeHtml(word)}</span>`);
    }
  }
  return tokens.join("");
}
