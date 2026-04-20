import { useCallback, useEffect, useRef, useState } from "react";
import { pickVoice } from "~/lib/tts";

export type SpeakerStatus = "idle" | "preparing" | "speaking" | "error";

export type BoundaryListener = (charIndex: number) => void;

export type SpeakOptions = {
  lang?: string;
  voice?: string | null;
};

export type Speaker = {
  status: SpeakerStatus;
  error: string | null;
  speak: (text: string, opts?: SpeakOptions) => Promise<void>;
  stop: () => void;
  onBoundary: (fn: BoundaryListener) => () => void;
};

/**
 * React wrapper around `window.speechSynthesis`. The utterance lifecycle
 * drives a small status state machine and notifies subscribers of the
 * `onboundary` event (used by the word-highlight controller).
 *
 * SSR-safe: every `window` / `speechSynthesis` access is guarded.
 */
export function useSpeaker(): Speaker {
  const [status, setStatus] = useState<SpeakerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const listenersRef = useRef<Set<BoundaryListener>>(new Set());
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearErrorTimer = useCallback(() => {
    if (errorTimerRef.current !== null) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined") return;
    clearErrorTimer();
    try {
      window.speechSynthesis.cancel();
    } catch {
      // no-op — some engines throw if nothing is speaking
    }
    utteranceRef.current = null;
    setStatus("idle");
    setError(null);
  }, [clearErrorTimer]);

  const onBoundary = useCallback((fn: BoundaryListener) => {
    listenersRef.current.add(fn);
    return () => {
      listenersRef.current.delete(fn);
    };
  }, []);

  const speak = useCallback(
    async (text: string, opts?: SpeakOptions): Promise<void> => {
      if (typeof window === "undefined" || typeof window.speechSynthesis === "undefined") {
        setStatus("error");
        setError("SpeechSynthesis unavailable in this environment.");
        return;
      }
      if (text.trim().length === 0) return;

      clearErrorTimer();
      setError(null);
      setStatus("preparing");

      // Cancel any in-flight utterance so the new one starts cleanly.
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }

      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      const lang = opts?.lang ?? "en-US";
      utterance.lang = lang;

      const voices = window.speechSynthesis.getVoices();
      const chosen = pickVoice(voices, lang, opts?.voice ?? null);
      if (chosen) {
        utterance.voice = chosen;
      }

      utterance.onstart = () => {
        setStatus("speaking");
      };
      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        const listeners = listenersRef.current;
        listeners.forEach((fn) => {
          try {
            fn(event.charIndex);
          } catch {
            // swallow subscriber errors so one bad listener can't stop speech
          }
        });
      };
      utterance.onend = () => {
        utteranceRef.current = null;
        setStatus("idle");
      };
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        utteranceRef.current = null;
        // `interrupted` and `canceled` fire on intentional stop() — not a real error.
        const errType = event.error;
        if (errType === "interrupted" || errType === "canceled") {
          setStatus("idle");
          return;
        }
        setError(typeof errType === "string" && errType.length > 0 ? errType : "speech-error");
        setStatus("error");
        clearErrorTimer();
        errorTimerRef.current = setTimeout(() => {
          setStatus("idle");
          setError(null);
          errorTimerRef.current = null;
        }, 1800);
      };

      utteranceRef.current = utterance;
      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        utteranceRef.current = null;
        setStatus("error");
        setError(err instanceof Error ? err.message : "speech-error");
        clearErrorTimer();
        errorTimerRef.current = setTimeout(() => {
          setStatus("idle");
          setError(null);
          errorTimerRef.current = null;
        }, 1800);
      }
    },
    [clearErrorTimer]
  );

  // Tear down on unmount — prevents speech from continuing across routes.
  useEffect(() => {
    const listeners = listenersRef.current;
    return () => {
      clearErrorTimer();
      if (typeof window !== "undefined") {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
      listeners.clear();
    };
  }, [clearErrorTimer]);

  return { status, error, speak, stop, onBoundary };
}
