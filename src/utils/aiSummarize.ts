// Chrome on-device AI — Prompt (LanguageModel) + Summarizer APIs.
// Both are gated behind availability checks and may not be present in every
// Chrome build. We try LanguageModel first (better style control), fall back
// to Summarizer, then finally return the raw structured text unchanged.
//
// Docs (subject to change, as these APIs are rolling out):
//  - https://developer.chrome.com/docs/ai/prompt-api
//  - https://developer.chrome.com/docs/ai/summarizer-api

type AiAvailability = "unavailable" | "downloadable" | "downloading" | "available";

interface SummarizerInstance {
  summarize(text: string, opts?: { context?: string }): Promise<string>;
  destroy?(): void;
}
interface SummarizerCtor {
  availability?(): Promise<AiAvailability>;
  create(opts?: {
    type?: "tldr" | "key-points" | "teaser" | "headline";
    format?: "plain-text" | "markdown";
    length?: "short" | "medium" | "long";
    sharedContext?: string;
  }): Promise<SummarizerInstance>;
}

interface LanguageModelSession {
  prompt(input: string): Promise<string>;
  destroy?(): void;
}
interface LanguageModelCtor {
  availability?(): Promise<AiAvailability>;
  create(opts?: {
    initialPrompts?: Array<{ role: "system" | "user" | "assistant"; content: string }>;
    temperature?: number;
    topK?: number;
  }): Promise<LanguageModelSession>;
}

declare global {
  interface Window {
    LanguageModel?: LanguageModelCtor;
    Summarizer?: SummarizerCtor;
  }
}

export const POKEMON_SYSTEM_PROMPT =
  "You are a friendly narrator recording a short voiceover about a Pokémon. " +
  "Speak in two to four warm, conversational sentences. " +
  'Open with the Pokémon\'s name — for example "This is Charizard." — then describe what kind of creature it is, ' +
  "one or two notable traits, and anything memorable about its personality or behaviour. " +
  "Do NOT read out raw numbers (height, weight, stats, catch rate). " +
  "The listener can already see those on screen — focus on character and feel. " +
  "No bullet points, no headings, no markdown — just natural prose. " +
  "Avoid saying the word 'Pokédex'.";

export type AiSource = "prompt" | "summarizer" | "fallback";

export type AiResult = {
  text: string;
  source: AiSource;
};

function getLanguageModel(): LanguageModelCtor | undefined {
  if (typeof window === "undefined") return undefined;
  return window.LanguageModel;
}

function getSummarizer(): SummarizerCtor | undefined {
  if (typeof window === "undefined") return undefined;
  return window.Summarizer;
}

export async function summarizeWithAi(
  rawContext: string,
  systemPrompt: string = POKEMON_SYSTEM_PROMPT,
): Promise<AiResult> {
  // 1) Prompt API — best style control.
  const lm = getLanguageModel();
  if (lm?.create) {
    try {
      const availability = (await lm.availability?.()) ?? "available";
      if (availability === "available") {
        const session = await lm.create({
          initialPrompts: [{ role: "system", content: systemPrompt }],
          temperature: 0.6,
        });
        const out = await session.prompt(rawContext);
        session.destroy?.();
        const trimmed = out?.trim();
        if (trimmed) return { text: trimmed, source: "prompt" };
      }
    } catch {
      /* fall through to Summarizer */
    }
  }

  // 2) Summarizer API — simpler, purpose-built.
  const su = getSummarizer();
  if (su?.create) {
    try {
      const availability = (await su.availability?.()) ?? "available";
      if (availability === "available") {
        const summarizer = await su.create({
          type: "tldr",
          format: "plain-text",
          length: "medium",
          sharedContext: systemPrompt,
        });
        const out = await summarizer.summarize(rawContext);
        summarizer.destroy?.();
        const trimmed = out?.trim();
        if (trimmed) return { text: trimmed, source: "summarizer" };
      }
    } catch {
      /* fall through */
    }
  }

  // 3) Fallback — the structured context itself reads passably aloud.
  return { text: rawContext, source: "fallback" };
}

export function hasAiSupport(): boolean {
  return !!(getLanguageModel() || getSummarizer());
}
