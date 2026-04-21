import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Locale } from "~/types/locales";
import { bcp47ForLocale, htmlToPlainText, ttsLog } from "~/lib/tts";
import { useSpeaker } from "~/hooks/useSpeaker";
import { usePreferences } from "~/hooks/usePreferences";

type Props = {
  /** Plain text or HTML; HTML tags are stripped before speaking. */
  text: string;
  locale: Locale;
  label: string;
  stopLabel: string;
  /** Optional voice-name override. Defaults to the user's Settings voice. */
  voice?: string | null;
  className?: string;
  /**
   * Identifier shared with any sibling button that plays the same snippet.
   * When two instances use the same key, their active state stays in sync.
   */
  speakKey?: string;
};

function fallbackKey(text: string): string {
  // Cheap 32-bit hash so two instances of the same `text` hash to the same
  // key by default, without forcing callers to provide one.
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `inline-${(h >>> 0).toString(36)}`;
}

/**
 * Small inline play/stop button for reading a single piece of text aloud
 * (e.g. the Pokédex flavor entry). Hooked into the same singleton speech
 * engine as SpeakButton — starting playback here pre-empts any other
 * utterance and flips the main summary button back to idle.
 */
export function InlineSpeakButton({
  text,
  locale,
  label,
  stopLabel,
  voice: voiceOverride,
  className,
  speakKey,
}: Props) {
  const speaker = useSpeaker();
  const { prefs } = usePreferences();
  const voice = voiceOverride ?? prefs.voice;
  const myKey = useMemo(() => speakKey ?? fallbackKey(text), [speakKey, text]);

  const isActive = speaker.activeKey === myKey;
  const isSpeaking = isActive && speaker.status === "speaking";
  const isPreparing = isActive && speaker.status === "preparing";

  useEffect(() => {
    ttsLog("[InlineSpeakButton] state", {
      myKey,
      isActive,
      status: speaker.status,
      supported: speaker.supported,
      activeKey: speaker.activeKey,
    });
  }, [myKey, isActive, speaker.status, speaker.supported, speaker.activeKey]);

  const myKeyRef = useRef(myKey);
  myKeyRef.current = myKey;
  const activeKeyRef = useRef(speaker.activeKey);
  activeKeyRef.current = speaker.activeKey;
  const stopRef = useRef(speaker.stop);
  stopRef.current = speaker.stop;
  useEffect(() => {
    return () => {
      if (activeKeyRef.current === myKeyRef.current) {
        stopRef.current();
      }
    };
  }, []);

  const handleClick = useCallback(async () => {
    ttsLog("[InlineSpeakButton] click", {
      myKey,
      isActive,
      status: speaker.status,
      supported: speaker.supported,
      textLen: text.length,
      textHead: text.slice(0, 60),
      voicePref: voice,
      locale,
    });
    if (!speaker.supported) {
      ttsLog("[InlineSpeakButton] click ABORT — speaker not supported");
      return;
    }
    if (isActive && (speaker.status === "speaking" || speaker.status === "preparing")) {
      ttsLog("[InlineSpeakButton] click → stop()");
      speaker.stop();
      return;
    }
    const plain = htmlToPlainText(text);
    ttsLog("[InlineSpeakButton] extracted plain text", {
      plainLen: plain.length,
      plainHead: plain.slice(0, 60),
    });
    if (plain.trim().length === 0) {
      ttsLog("[InlineSpeakButton] click ABORT — empty plain text");
      return;
    }
    ttsLog("[InlineSpeakButton] → speaker.speak()");
    await speaker.speak(plain, { key: myKey, lang: bcp47ForLocale(locale), voice });
  }, [isActive, speaker, text, locale, voice, myKey]);

  const ariaLabel = isSpeaking ? stopLabel : label;
  const cls = ["inline-speak", isSpeaking ? "inline-speak--speaking" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={cls}
      onClick={handleClick}
      aria-label={ariaLabel}
      aria-pressed={isSpeaking}
      aria-busy={isPreparing || undefined}
      disabled={!speaker.supported}
    >
      {isPreparing ? (
        <svg
          className="inline-speak__icon inline-speak__icon--spin"
          viewBox="0 0 24 24"
          aria-hidden="true"
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
      ) : isSpeaking ? (
        <svg className="inline-speak__icon" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
        </svg>
      ) : (
        <svg className="inline-speak__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M8 5.14v13.72a1 1 0 0 0 1.53.85l11-6.86a1 1 0 0 0 0-1.7l-11-6.86A1 1 0 0 0 8 5.14Z"
            fill="currentColor"
          />
        </svg>
      )}
    </button>
  );
}
