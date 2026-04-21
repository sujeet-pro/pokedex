import { useCallback, useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import type { Locale } from "~/types/locales";
import { bcp47ForLocale, htmlToPlainText, ttsLog } from "~/lib/tts";
import { useSpeaker } from "~/hooks/useSpeaker";
import { useSummary, type NarrativeInput, type SummaryKind } from "~/hooks/useSummary";
import { usePreferences } from "~/hooks/usePreferences";

type Props = {
  kind: SummaryKind;
  slug: string;
  displayName?: string;
  locale: Locale;
  /** Pre-rendered HTML from the bundle (with `<span data-w="N">` word tokens). */
  bundleHtml?: string | null;
  /** Container that wraps the rendered summary HTML, used for word-highlight. */
  summaryContainerRef?: RefObject<HTMLElement | null>;
  /** Called lazily to build AI context + fallback when no bundle HTML exists. */
  narrativeBuilder?: () => NarrativeInput;
  /** Optional voice-name override. Defaults to the user's Settings voice. */
  voice?: string | null;
};

const LABELS: Record<Locale, { play: string; stop: string; preparing: string; error: string }> = {
  en: {
    play: "Play summary",
    stop: "Stop",
    preparing: "Preparing summary",
    error: "Playback error",
  },
  es: {
    play: "Escuchar resumen",
    stop: "Detener",
    preparing: "Preparando resumen",
    error: "Error de reproducción",
  },
};

function PlayIcon() {
  return (
    <svg className="speak-bezel__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M8 5.14v13.72a1 1 0 0 0 1.53.85l11-6.86a1 1 0 0 0 0-1.7l-11-6.86A1 1 0 0 0 8 5.14Z"
        fill="currentColor"
      />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg className="speak-bezel__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.25"
      />
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

export function SpeakButton({
  kind,
  slug,
  displayName,
  locale,
  bundleHtml,
  summaryContainerRef,
  narrativeBuilder,
  voice: voiceOverride,
}: Props) {
  const speaker = useSpeaker();
  const { prefs } = usePreferences();
  const voice = voiceOverride ?? prefs.voice;
  const labels = LABELS[locale];
  const highlightedRef = useRef<HTMLElement | null>(null);

  // Identity shared across every speak/popover button rendered for the same
  // entity on the page. When multiple buttons for the same entity are
  // mounted they all read the same `activeKey` and light up together.
  const speakKey = useMemo(() => `${kind}-${slug}`, [kind, slug]);

  const { html } = useSummary({
    kind,
    slug,
    locale,
    bundleHtml: bundleHtml ?? null,
    narrativeBuilder,
  });

  const isActive = speaker.activeKey === speakKey;
  const isSpeaking = isActive && speaker.status === "speaking";
  const isPreparing = isActive && speaker.status === "preparing";
  const isError = isActive && speaker.status === "error";
  const isReady = html != null;

  useEffect(() => {
    ttsLog("[SpeakButton] state", {
      speakKey,
      isReady,
      isActive,
      status: speaker.status,
      supported: speaker.supported,
      activeKey: speaker.activeKey,
    });
  }, [speakKey, isReady, isActive, speaker.status, speaker.supported, speaker.activeKey]);

  // If this button owns the active utterance when it unmounts (route change),
  // stop playback so the next page starts quietly.
  const speakKeyRef = useRef(speakKey);
  speakKeyRef.current = speakKey;
  const activeKeyRef = useRef(speaker.activeKey);
  activeKeyRef.current = speaker.activeKey;
  const stopRef = useRef(speaker.stop);
  stopRef.current = speaker.stop;
  useEffect(() => {
    return () => {
      if (activeKeyRef.current === speakKeyRef.current) {
        stopRef.current();
      }
      if (highlightedRef.current) {
        highlightedRef.current.classList.remove("is-speaking");
        highlightedRef.current = null;
      }
    };
  }, []);

  // Word-highlight: subscribe to boundary events and advance the
  // `is-speaking` class along the `<span data-w="N">` markers. Ignore
  // events that arrive while another entity is the active speaker.
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

    const unsubscribe = speaker.onBoundary((charIndex, eventKey) => {
      if (eventKey !== speakKey) return;
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
  }, [summaryContainerRef, speaker, speakKey]);

  // Clear a leftover word-highlight whenever playback ends or another key
  // takes over (the shared engine cannot clear it for us).
  useEffect(() => {
    if (isSpeaking) return;
    if (highlightedRef.current) {
      highlightedRef.current.classList.remove("is-speaking");
      highlightedRef.current = null;
    }
  }, [isSpeaking]);

  const handleClick = useCallback(async () => {
    ttsLog("[SpeakButton] click", {
      speakKey,
      isActive,
      status: speaker.status,
      supported: speaker.supported,
      hasHtml: html != null,
      htmlLen: html?.length ?? 0,
      voicePref: voice,
      locale,
    });
    if (!speaker.supported) {
      ttsLog("[SpeakButton] click ABORT — speaker not supported");
      return;
    }
    if (isActive && (speaker.status === "speaking" || speaker.status === "preparing")) {
      ttsLog("[SpeakButton] click → stop()");
      speaker.stop();
      return;
    }
    if (!html) {
      ttsLog("[SpeakButton] click ABORT — no html yet");
      return;
    }
    const text = htmlToPlainText(html);
    ttsLog("[SpeakButton] extracted plain text", {
      textLen: text.length,
      head: text.slice(0, 60),
    });
    if (text.length === 0) {
      ttsLog("[SpeakButton] click ABORT — empty plain text");
      return;
    }
    ttsLog("[SpeakButton] → speaker.speak()");
    await speaker.speak(text, {
      key: speakKey,
      lang: bcp47ForLocale(locale),
      voice,
    });
  }, [isActive, speaker, html, speakKey, locale, voice]);

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

  // Disabled while the summary text is not yet available (typical when the
  // entity has no bundle-shipped summary and the idle-time AI pass is still
  // running) or when the browser does not support SpeechSynthesis. Do NOT
  // disable merely because the speaker is active — we want the button to
  // double as a Stop control while speaking.
  const disabled = !speaker.supported || (!isReady && !isActive);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={handleClick}
        aria-label={ariaLabel}
        aria-pressed={isSpeaking}
        aria-busy={isPreparing || undefined}
        disabled={disabled}
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
