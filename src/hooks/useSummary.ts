import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Locale } from "~/types/locales";
import { summarizeWithAi } from "~/lib/aiSummarize";
import { textToSummaryHtml } from "~/lib/summaryHtml";
import { ttsLog } from "~/lib/tts";

export type SummaryKind = "pokemon" | "berry" | "item" | "move" | "location" | "generation";

export type SummarySource = "bundle" | "client";

export type SummaryData = { html: string; source: SummarySource };

export type NarrativeInput = {
  richContext: string;
  friendlyFallback: string;
  systemPrompt: string;
};

type Params = {
  kind: SummaryKind;
  slug: string;
  locale: Locale;
  /** Pre-rendered HTML from the bundle (with `<span data-w>` word tokens). */
  bundleHtml: string | null;
  /** Builder for AI context; required when `bundleHtml` is null. */
  narrativeBuilder?: () => NarrativeInput;
  /**
   * Kick off AI generation automatically during an idle callback after
   * mount (when there is no bundle HTML). Defaults to `true` — the
   * Pokémon detail view wants the summary ready by the time the user
   * reaches for the play button. Set to `false` if the caller wants to
   * gate generation behind user interaction.
   */
  autoGenerateOnIdle?: boolean;
};

export type UseSummaryResult = {
  html: string | null;
  source: SummarySource | null;
  isGenerating: boolean;
  error: Error | null;
  /** Start (or reuse) an AI summary generation. Returns cached HTML when available. */
  generate: () => Promise<string | null>;
};

type IdleCallbackHandle = number;
type IdleRequestCallback = (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void;
type IdleWindow = Window & {
  requestIdleCallback?: (
    cb: IdleRequestCallback,
    opts?: { timeout?: number },
  ) => IdleCallbackHandle;
  cancelIdleCallback?: (handle: IdleCallbackHandle) => void;
};

/**
 * Schedule work for when the browser is idle. Falls back to a short
 * `setTimeout` when `requestIdleCallback` is unavailable (Safari).
 * Returns a cancel function.
 */
function scheduleIdle(fn: () => void, timeoutMs = 2000): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  const w = window as IdleWindow;
  if (typeof w.requestIdleCallback === "function") {
    const handle = w.requestIdleCallback(() => fn(), { timeout: timeoutMs });
    return () => {
      if (typeof w.cancelIdleCallback === "function") {
        w.cancelIdleCallback(handle);
      }
    };
  }
  const t = setTimeout(fn, 200);
  return () => clearTimeout(t);
}

/**
 * Returns the HTML summary for a (kind, slug, locale) tuple. The query key is
 * shared so that SpeakButton + SummaryPopover see the same cache entry: the
 * first one to trigger generation populates it for the other. The `source`
 * field distinguishes a bundle-shipped summary from one generated on-device.
 */
export function useSummary({
  kind,
  slug,
  locale,
  bundleHtml,
  narrativeBuilder,
  autoGenerateOnIdle = true,
}: Params): UseSummaryResult {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ["summary", kind, slug, locale] as const, [kind, slug, locale]);

  useEffect(() => {
    if (!bundleHtml) return;
    if (queryClient.getQueryData<SummaryData>(queryKey) === undefined) {
      queryClient.setQueryData<SummaryData>(queryKey, { html: bundleHtml, source: "bundle" });
    }
  }, [queryClient, queryKey, bundleHtml]);

  const initialData: SummaryData | undefined = bundleHtml
    ? { html: bundleHtml, source: "bundle" }
    : undefined;

  const query = useQuery<SummaryData, Error>({
    queryKey,
    queryFn: async () => {
      ttsLog("[useSummary] queryFn start", { kind, slug, locale });
      if (!narrativeBuilder) {
        ttsLog("[useSummary] queryFn ABORT — narrativeBuilder missing");
        throw new Error("narrativeBuilder missing");
      }
      const narrative = narrativeBuilder();
      const result = await summarizeWithAi(narrative.richContext, narrative.systemPrompt, locale);
      ttsLog("[useSummary] summarizeWithAi result", {
        source: result.source,
        textLen: result.text.length,
      });
      const text = result.source === "fallback" ? narrative.friendlyFallback : result.text;
      if (text.trim().length === 0) {
        ttsLog("[useSummary] queryFn ABORT — empty summary text");
        throw new Error("Empty summary");
      }
      const html = textToSummaryHtml(text);
      ttsLog("[useSummary] queryFn success", {
        source: "client",
        htmlLen: html.length,
      });
      return { html, source: "client" };
    },
    enabled: false,
    initialData,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    ttsLog("[useSummary] data changed", {
      kind,
      slug,
      locale,
      hasHtml: query.data?.html != null,
      htmlLen: query.data?.html?.length ?? 0,
      source: query.data?.source ?? null,
      isFetching: query.isFetching,
      error: query.error?.message ?? null,
    });
  }, [kind, slug, locale, query.data, query.isFetching, query.error]);

  const generate = useCallback(async (): Promise<string | null> => {
    const cached = queryClient.getQueryData<SummaryData>(queryKey);
    if (cached) return cached.html;
    const r = await query.refetch();
    return r.data?.html ?? null;
  }, [queryClient, queryKey, query]);

  // Auto-generate during an idle callback once the page has settled, so the
  // read-aloud button is armed by the time the user reaches for it. We only
  // schedule when there is no bundle HTML and the query has not yet
  // produced data or errored. `narrativeBuilder` is usually an inline
  // arrow (unstable across renders) so we stash it in a ref and keep the
  // effect's dependency surface to the identity of the entity + the
  // opt-in flag.
  const narrativeBuilderRef = useRef(narrativeBuilder);
  narrativeBuilderRef.current = narrativeBuilder;
  const generateRef = useRef(generate);
  generateRef.current = generate;
  useEffect(() => {
    if (!autoGenerateOnIdle) return;
    if (bundleHtml) return;
    if (!narrativeBuilderRef.current) return;
    // Don't kick off a second pass if the cache already has the answer —
    // another consumer (SpeakButton, SummaryPopover) may have won the race.
    if (queryClient.getQueryData<SummaryData>(queryKey)) return;
    const cancel = scheduleIdle(() => {
      if (queryClient.getQueryData<SummaryData>(queryKey)) return;
      void generateRef.current();
    });
    return cancel;
  }, [autoGenerateOnIdle, bundleHtml, queryClient, queryKey]);

  return {
    html: query.data?.html ?? null,
    source: query.data?.source ?? null,
    isGenerating: query.isFetching,
    error: query.error,
    generate,
  };
}
