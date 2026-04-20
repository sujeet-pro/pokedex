import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import type { Locale } from "~/types/locales";
import { summarizeWithAi } from "~/lib/aiSummarize";
import { bcp47ForLocale, htmlToPlainText } from "~/lib/tts";
import { useSpeaker } from "~/hooks/useSpeaker";

type Kind = "pokemon" | "berry" | "item" | "move" | "location" | "generation";

type NarrativeInput = {
  richContext: string;
  friendlyFallback: string;
  systemPrompt: string;
};

type Props = {
  kind: Kind;
  slug: string;
  displayName?: string;
  locale: Locale;
  /** Pre-rendered HTML with `<span data-w="N">` word tokens (from bundle). */
  summaryHtml?: string | null;
  /** Container that wraps the rendered summary HTML, used for word-highlight. */
  summaryContainerRef?: RefObject<HTMLElement | null>;
  /** Called lazily to build AI context + fallback when no summary_html exists. */
  narrativeBuilder?: () => NarrativeInput;
  /** Optional preferred voice name (from user preferences). */
  voice?: string | null;
};

/* -------------------------------------------------------------------- */
/* Localized strings                                                    */
/* -------------------------------------------------------------------- */

const LABELS: Record<Locale, { play: string; stop: string; preparing: string; error: string }> = {
  en: {
    play: "Play summary",
    stop: "Stop",
    preparing: "Preparing summary",
    error: "Playback error",
  },
  fr: {
    play: "Écouter le résumé",
    stop: "Arrêter",
    preparing: "Préparation du résumé",
    error: "Erreur de lecture",
  },
};

/* -------------------------------------------------------------------- */
/* Inline icons (no external icon library)                              */
/* -------------------------------------------------------------------- */

function PlayIcon() {
  return (
    <svg
      className="speak-bezel__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 5.14v13.72a1 1 0 0 0 1.53.85l11-6.86a1 1 0 0 0 0-1.7l-11-6.86A1 1 0 0 0 8 5.14Z" fill="currentColor" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg
      className="speak-bezel__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
    </svg>
  );
}

function LoaderIcon() {
  return (
    <svg
      className="speak-bezel__icon speak-bezel__icon--spin"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------- */
/* Component                                                            */
/* -------------------------------------------------------------------- */

export function SpeakButton({
  kind,
  slug,
  displayName,
  locale,
  summaryHtml,
  summaryContainerRef,
  narrativeBuilder,
  voice,
}: Props) {
  void kind;
  void slug;

  const speaker = useSpeaker();
  const labels = LABELS[locale];
  const [preparing, setPreparing] = useState(false);
  const highlightedRef = useRef<HTMLElement | null>(null);

  // Unmount/route change: stop speech.
  useEffect(() => {
    return () => {
      speaker.stop();
      if (highlightedRef.current) {
        highlightedRef.current.classList.remove("is-speaking");
        highlightedRef.current = null;
      }
    };
  }, [speaker]);

  // Word-highlight subscription. `getBoundary()` walks the container's
  // `[data-w]` spans (sorted ascending by char-offset) and toggles the
  // `.is-speaking` class on the span whose range contains the current
  // char index.
  useEffect(() => {
    if (!summaryContainerRef?.current) return;
    const container = summaryContainerRef.current;
    const spans = Array.from(container.querySelectorAll<HTMLElement>("[data-w]"));
    if (spans.length === 0) return;

    type Entry = { node: HTMLElement; offset: number };
    const entries: Entry[] = spans
      .map((node) => ({ node, offset: Number(node.dataset.w) }))
      .filter((entry) => Number.isFinite(entry.offset))
      .toSorted((a, b) => a.offset - b.offset);
    if (entries.length === 0) return;

    const unsubscribe = speaker.onBoundary((charIndex) => {
      // Find the last entry whose offset is <= charIndex.
      let lo = 0;
      let hi = entries.length - 1;
      let match = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (entries[mid]!.offset <= charIndex) {
          match = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      if (match < 0) return;
      const next = entries[match]!.node;
      if (highlightedRef.current === next) return;
      if (highlightedRef.current) {
        highlightedRef.current.classList.remove("is-speaking");
      }
      next.classList.add("is-speaking");
      highlightedRef.current = next;
    });

    return () => {
      unsubscribe();
    };
  }, [summaryContainerRef, speaker]);

  // Clear any lingering highlight once speech returns to idle.
  useEffect(() => {
    if (speaker.status === "idle" && highlightedRef.current) {
      highlightedRef.current.classList.remove("is-speaking");
      highlightedRef.current = null;
    }
  }, [speaker.status]);

  const handleClick = useCallback(async () => {
    // Second click while speaking / preparing stops.
    if (speaker.status === "speaking" || speaker.status === "preparing" || preparing) {
      speaker.stop();
      setPreparing(false);
      return;
    }

    // 1) If summary_html is already on the bundle, speak its plain text.
    if (summaryHtml && summaryHtml.trim().length > 0) {
      const text = htmlToPlainText(summaryHtml);
      if (text.length === 0) return;
      await speaker.speak(text, { lang: bcp47ForLocale(locale), voice });
      return;
    }

    // 2) Otherwise, try on-device AI (falling back to the friendly paragraph).
    if (!narrativeBuilder) return;
    setPreparing(true);
    try {
      const narrative = narrativeBuilder();
      const result = await summarizeWithAi(
        narrative.richContext,
        narrative.systemPrompt,
        locale
      );
      const text = result.source === "fallback" ? narrative.friendlyFallback : result.text;
      if (text.trim().length === 0) return;
      await speaker.speak(text, { lang: bcp47ForLocale(locale), voice });
    } finally {
      setPreparing(false);
    }
  }, [speaker, preparing, summaryHtml, narrativeBuilder, locale, voice]);

  const isSpeaking = speaker.status === "speaking";
  const isPreparing = speaker.status === "preparing" || preparing;
  const isError = speaker.status === "error";

  const ariaLabel = useMemo(() => {
    const base = isSpeaking ? labels.stop : labels.play;
    return displayName ? `${base} — ${displayName}` : base;
  }, [isSpeaking, labels, displayName]);

  const statusText = useMemo(() => {
    if (isError) return labels.error;
    if (isPreparing) return labels.preparing;
    if (isSpeaking) return labels.stop;
    return "";
  }, [isError, isPreparing, isSpeaking, labels]);

  const className = [
    "speak-bezel",
    isSpeaking ? "speak-bezel--speaking" : "",
    isError ? "speak-bezel--error" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={handleClick}
        aria-label={ariaLabel}
        aria-pressed={isSpeaking}
        disabled={false}
      >
        {isPreparing ? <LoaderIcon /> : isSpeaking ? <StopIcon /> : <PlayIcon />}
      </button>
      <span
        aria-live="polite"
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          margin: "-1px",
          padding: 0,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {statusText}
      </span>
    </>
  );
}
