import type { Locale } from "~/types/locales";

/* -------------------------------------------------------------------- */
/* Ambient typings for Chrome on-device AI                              */
/* -------------------------------------------------------------------- */

type AvailabilityState = "available" | "downloadable" | "downloading" | "unavailable";

type LanguageModelSession = {
  prompt(input: string): Promise<string>;
};

type LanguageModelStatic = {
  availability?: () => Promise<AvailabilityState>;
  create: (options: {
    initialPrompts?: { role: "system" | "user" | "assistant"; content: string }[];
    temperature?: number;
    topK?: number;
  }) => Promise<LanguageModelSession>;
};

type SummarizerSession = {
  summarize(input: string): Promise<string>;
};

type SummarizerStatic = {
  availability?: () => Promise<AvailabilityState>;
  create: (options: {
    type?: "tldr" | "key-points" | "teaser" | "headline";
    format?: "plain-text" | "markdown";
    length?: "short" | "medium" | "long";
    sharedContext?: string;
  }) => Promise<SummarizerSession>;
};

declare global {
  interface Window {
    LanguageModel?: LanguageModelStatic;
    Summarizer?: SummarizerStatic;
  }
}

/* -------------------------------------------------------------------- */
/* Public API                                                           */
/* -------------------------------------------------------------------- */

export type AiSource = "prompt" | "summarizer" | "fallback";

export function hasAiSupport(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.LanguageModel) || Boolean(window.Summarizer);
}

async function isReady(availability?: () => Promise<AvailabilityState>): Promise<boolean> {
  if (!availability) return true; // if no probe exists, assume the API is ready
  try {
    const state = await availability();
    return state === "available" || state === "downloadable";
  } catch {
    return false;
  }
}

export async function summarizeWithAi(
  rawContext: string,
  systemPrompt?: string,
  locale: Locale = "en"
): Promise<{ text: string; source: AiSource }> {
  // Locale is accepted for API symmetry (the caller's system prompt is already
  // localized via narrative builders). Referenced here so strict unused-var
  // rules stay happy while keeping the signature stable.
  void locale;

  if (typeof window === "undefined") {
    return { text: rawContext, source: "fallback" };
  }

  // 1) Chrome Prompt API (LanguageModel)
  try {
    const lm = window.LanguageModel;
    if (lm && (await isReady(lm.availability))) {
      const session = await lm.create({
        initialPrompts: systemPrompt
          ? [{ role: "system", content: systemPrompt }]
          : undefined,
        temperature: 0.6,
        topK: 40,
      });
      const text = await session.prompt(rawContext);
      const trimmed = text.trim();
      if (trimmed.length > 0) {
        return { text: trimmed, source: "prompt" };
      }
    }
  } catch {
    // fall through to Summarizer
  }

  // 2) Summarizer API
  try {
    const sm = window.Summarizer;
    if (sm && (await isReady(sm.availability))) {
      const summarizer = await sm.create({
        type: "tldr",
        format: "plain-text",
        length: "medium",
        sharedContext: systemPrompt,
      });
      const text = await summarizer.summarize(rawContext);
      const trimmed = text.trim();
      if (trimmed.length > 0) {
        return { text: trimmed, source: "summarizer" };
      }
    }
  } catch {
    // fall through to fallback
  }

  return { text: rawContext, source: "fallback" };
}
