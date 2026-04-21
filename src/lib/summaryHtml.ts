/**
 * Client-side fallback that turns plain text (paragraphs separated by blank
 * lines, as returned by the on-device AI) into simple `<p>`-wrapped HTML for
 * the summary popover. No `<span data-w>` tokens — the word-highlight feature
 * only runs against server-tokenised summaries from the bundle.
 */
export function textToSummaryHtml(text: string): string {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (paragraphs.length === 0) return "";
  return paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
