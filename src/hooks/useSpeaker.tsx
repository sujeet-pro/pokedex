import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { pickVoice, ttsLog } from "~/lib/tts";

export type SpeakerStatus = "idle" | "preparing" | "speaking" | "error";

export type BoundaryListener = (charIndex: number, key: string | null) => void;

export type SpeakOptions = {
  /** Identifier for the requesting button; exposed as `activeKey` while speaking. */
  key?: string;
  lang?: string;
  voice?: string | null;
};

export type Speaker = {
  status: SpeakerStatus;
  error: string | null;
  /** Which `key` is currently preparing/speaking, if any. */
  activeKey: string | null;
  /** Does the browser even offer SpeechSynthesis? */
  supported: boolean;
  speak: (text: string, opts?: SpeakOptions) => Promise<void>;
  stop: () => void;
  onBoundary: (fn: BoundaryListener) => () => void;
};

const SpeakerContext = createContext<Speaker | null>(null);

/**
 * Singleton wrapper around `window.speechSynthesis`.
 *
 * - One active utterance across the whole app — every `SpeakButton` /
 *   `InlineSpeakButton` shares this state so that pressing play in one
 *   place flips the others back to idle.
 * - Chrome reliability fixes: wait for `voiceschanged` when the voice list
 *   is not yet populated; apply a microtask delay between `cancel()` and
 *   the next `speak()` to dodge the well-known queue-drain race; periodic
 *   `pause()`+`resume()` while speaking to work around Chrome's ~15 s
 *   auto-stop on long utterances; a preparing-state watchdog so the UI
 *   does not stay pinned on a spinner when `onstart` silently never fires.
 * - SSR-safe: every `window` / `speechSynthesis` access is guarded.
 */
export function SpeakerProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SpeakerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  // Start at `false` so SSR and the first client render agree; flip to the
  // real value in a mount effect. Using `useMemo` here would return `true`
  // on the first client render and mismatch the SSR HTML.
  const [supported, setSupported] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeKeyRef = useRef<string | null>(null);
  const listenersRef = useRef<Set<BoundaryListener>>(new Set());
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prepareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keepAliveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      ttsLog("[provider] mount — window undefined, skipping");
      return;
    }
    if (typeof window.speechSynthesis === "undefined") {
      ttsLog("[provider] mount — speechSynthesis unavailable");
      return;
    }
    setSupported(true);
    const synth = window.speechSynthesis;
    const initial = synth.getVoices();
    ttsLog("[provider] mount — supported=true, initial voices:", initial.length, {
      sample: initial.slice(0, 10).map((v) => ({
        name: v.name,
        lang: v.lang,
        localService: v.localService,
        default: v.default,
      })),
      speaking: synth.speaking,
      pending: synth.pending,
      paused: synth.paused,
    });
    const onChange = () => {
      const next = synth.getVoices();
      ttsLog("[provider] voiceschanged:", next.length, {
        sample: next.slice(0, 10).map((v) => ({
          name: v.name,
          lang: v.lang,
          localService: v.localService,
          default: v.default,
        })),
      });
    };
    synth.addEventListener("voiceschanged", onChange);

    // Diagnostic helpers on `window` — bypass our pipeline to isolate the
    // problem. Run from DevTools console (counts as a user gesture).
    type DiagWindow = Window & {
      __ttsTest?: (text?: string, voiceName?: string) => void;
      __ttsVoices?: () => void;
      __ttsSweep?: (text?: string) => Promise<void>;
    };

    // Minimal speak — no cancel(), no voice set, no lang set. If this is
    // silent the problem is upstream (muted tab, Chrome audio perm, OS).
    (window as DiagWindow).__ttsTest = (text = "Hello, this is a test.", voiceName) => {
      const s = window.speechSynthesis;
      const u = new window.SpeechSynthesisUtterance(text);
      const voices = s.getVoices();
      if (voiceName) {
        const v = voices.find((x) => x.name === voiceName);
        if (v) {
          u.voice = v;
          u.lang = v.lang;
        }
        ttsLog("[__ttsTest] using voice:", v ? `${v.name} (${v.lang})` : `<not found "${voiceName}", default>`);
      } else {
        ttsLog("[__ttsTest] no voice set — engine default");
      }
      u.onstart = () => ttsLog("[__ttsTest] onstart ✅");
      u.onend = () => ttsLog("[__ttsTest] onend");
      u.onerror = (e) => ttsLog("[__ttsTest] onerror ❌", e.error);
      s.speak(u);
      ttsLog("[__ttsTest] speak() called; speaking=", s.speaking, "pending=", s.pending);
    };

    // Dump the full voice list to the console with local/default/remote flags.
    (window as DiagWindow).__ttsVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      // eslint-disable-next-line no-console
      console.table(
        voices.map((v) => ({
          name: v.name,
          lang: v.lang,
          local: v.localService,
          default: v.default,
          uri: v.voiceURI,
        }))
      );
    };

    // Cycle through every en-* voice and speak the same short phrase on
    // each. Watch/listen — the first one you HEAR is a voice that works.
    (window as DiagWindow).__ttsSweep = async (text = "Pikachu.") => {
      const s = window.speechSynthesis;
      const all = s.getVoices();
      const en = all.filter((v) => v.lang.toLowerCase().startsWith("en"));
      ttsLog("[__ttsSweep] cycling through", en.length, "English voices");
      for (const v of en) {
        await new Promise<void>((resolve) => {
          const u = new window.SpeechSynthesisUtterance(`${v.name}. ${text}`);
          u.voice = v;
          u.lang = v.lang;
          let done = false;
          const finish = (why: string) => {
            if (done) return;
            done = true;
            ttsLog(`[__ttsSweep] "${v.name}" (${v.lang}) → ${why}`);
            resolve();
          };
          u.onend = () => finish("ended");
          u.onerror = (e) => finish(`error ${e.error}`);
          setTimeout(() => finish("timeout 6s"), 6000);
          s.speak(u);
        });
      }
      ttsLog("[__ttsSweep] done");
    };

    return () => {
      ttsLog("[provider] unmount");
      synth.removeEventListener("voiceschanged", onChange);
      const w = window as DiagWindow;
      delete w.__ttsTest;
      delete w.__ttsVoices;
      delete w.__ttsSweep;
    };
  }, []);

  const clearErrorTimer = useCallback(() => {
    if (errorTimerRef.current !== null) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
  }, []);

  const clearPrepareTimer = useCallback(() => {
    if (prepareTimerRef.current !== null) {
      clearTimeout(prepareTimerRef.current);
      prepareTimerRef.current = null;
    }
  }, []);

  const clearKeepAlive = useCallback(() => {
    if (keepAliveTimerRef.current !== null) {
      clearInterval(keepAliveTimerRef.current);
      keepAliveTimerRef.current = null;
    }
  }, []);

  const setActive = useCallback((key: string | null) => {
    activeKeyRef.current = key;
    setActiveKey(key);
  }, []);

  const stop = useCallback(() => {
    ttsLog("[stop] called", {
      activeKey: activeKeyRef.current,
      speaking: typeof window !== "undefined" && window.speechSynthesis?.speaking,
      pending: typeof window !== "undefined" && window.speechSynthesis?.pending,
    });
    if (typeof window === "undefined") return;
    clearErrorTimer();
    clearPrepareTimer();
    clearKeepAlive();
    try {
      window.speechSynthesis.cancel();
      ttsLog("[stop] synth.cancel() ok");
    } catch (err) {
      ttsLog("[stop] synth.cancel() threw (benign)", err);
    }
    utteranceRef.current = null;
    setActive(null);
    setStatus("idle");
    setError(null);
  }, [clearErrorTimer, clearPrepareTimer, clearKeepAlive, setActive]);

  const onBoundary = useCallback((fn: BoundaryListener) => {
    listenersRef.current.add(fn);
    return () => {
      listenersRef.current.delete(fn);
    };
  }, []);

  /**
   * Resolve the current `SpeechSynthesisVoice` list. If the browser hasn't
   * populated it yet (Chrome ships the voices asynchronously) wait for the
   * `voiceschanged` event once, with a short timeout fallback.
   */
  const loadVoices = useCallback((): Promise<SpeechSynthesisVoice[]> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") {
        resolve([]);
        return;
      }
      const synth = window.speechSynthesis;
      const current = synth.getVoices();
      if (current.length > 0) {
        resolve(current);
        return;
      }
      let settled = false;
      const onChange = () => {
        if (settled) return;
        settled = true;
        synth.removeEventListener("voiceschanged", onChange);
        resolve(synth.getVoices());
      };
      synth.addEventListener("voiceschanged", onChange);
      // Some Chromium builds never fire the event; after 600 ms just try
      // whatever list is available (possibly still empty → default voice).
      setTimeout(() => {
        if (settled) return;
        settled = true;
        synth.removeEventListener("voiceschanged", onChange);
        resolve(synth.getVoices());
      }, 600);
    });
  }, []);

  const speak = useCallback(
    (text: string, opts?: SpeakOptions): Promise<void> => {
      ttsLog("[speak] called", {
        textLen: text.length,
        head: text.slice(0, 60),
        opts,
      });
      if (typeof window === "undefined" || typeof window.speechSynthesis === "undefined") {
        ttsLog("[speak] ABORT — SpeechSynthesis unavailable");
        setStatus("error");
        setError("SpeechSynthesis unavailable in this environment.");
        return Promise.resolve();
      }
      if (text.trim().length === 0) {
        ttsLog("[speak] ABORT — empty text after trim");
        return Promise.resolve();
      }

      clearErrorTimer();
      clearPrepareTimer();
      clearKeepAlive();

      const synth = window.speechSynthesis;
      ttsLog("[speak] engine state on entry:", {
        speaking: synth.speaking,
        pending: synth.pending,
        paused: synth.paused,
      });

      // IMPORTANT: the rest of this function runs SYNCHRONOUSLY — no
      // `await` before `synth.speak()`. Browsers (especially Safari, but
      // also some Chromium builds with stricter autoplay settings) count
      // the user-gesture "activation" only for the task that handled the
      // click. Anything past an `await` runs in a new task and the speak
      // call is silently refused.
      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      const lang = opts?.lang ?? "en-US";
      utterance.lang = lang;

      // `getVoices()` is empty on the very first call in Chrome; don't
      // block on the `voiceschanged` event — the engine picks a default
      // voice when `utterance.voice` is left unset.
      const currentVoices = synth.getVoices();
      const chosen = pickVoice(currentVoices, lang, opts?.voice ?? null);
      ttsLog("[speak] voice pick", {
        requestedLang: lang,
        requestedVoice: opts?.voice ?? null,
        voicesAvailable: currentVoices.length,
        chosen: chosen
          ? {
              name: chosen.name,
              lang: chosen.lang,
              localService: chosen.localService,
              default: chosen.default,
              voiceURI: chosen.voiceURI,
            }
          : "<engine default>",
      });
      if (chosen) {
        utterance.voice = chosen;
        // Align utterance.lang with the chosen voice's lang. A mismatch
        // (e.g. utterance.lang="en-US" + voice.lang="en-GB") silently fails
        // on some Chrome builds — engine reports `speaking` but no audio.
        if (chosen.lang && chosen.lang !== utterance.lang) {
          ttsLog("[speak] aligning utterance.lang to voice.lang:", chosen.lang);
          utterance.lang = chosen.lang;
        }
      }

      const myKey = opts?.key ?? null;

      const startKeepAlive = () => {
        // Chrome stops speaking after ~15 s for a single long utterance.
        // The well-documented workaround is a pause()+resume() heartbeat.
        clearKeepAlive();
        keepAliveTimerRef.current = setInterval(() => {
          if (typeof window === "undefined") return;
          try {
            if (synth.speaking) {
              synth.pause();
              synth.resume();
            }
          } catch {
            // ignore
          }
        }, 10_000);
      };

      let boundaryCount = 0;
      utterance.onstart = () => {
        ttsLog("[utterance] onstart fired", { myKey });
        clearPrepareTimer();
        setStatus("speaking");
        startKeepAlive();
      };
      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        boundaryCount += 1;
        // Log first 3 boundaries to confirm the engine is actually emitting
        // them, then 1 per 20 so the console doesn't drown.
        if (boundaryCount <= 3 || boundaryCount % 20 === 0) {
          ttsLog("[utterance] onboundary", {
            n: boundaryCount,
            charIndex: event.charIndex,
            name: event.name,
          });
        }
        const listeners = listenersRef.current;
        listeners.forEach((fn) => {
          try {
            fn(event.charIndex, activeKeyRef.current);
          } catch (err) {
            // swallow subscriber errors so one bad listener can't stop speech
            ttsLog("[utterance] onboundary listener threw", err);
          }
        });
      };
      utterance.onend = () => {
        ttsLog("[utterance] onend fired", {
          myKey,
          boundaries: boundaryCount,
          stillActive: activeKeyRef.current === myKey,
        });
        clearKeepAlive();
        clearPrepareTimer();
        utteranceRef.current = null;
        if (activeKeyRef.current === myKey) {
          setActive(null);
          setStatus("idle");
        }
      };
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        ttsLog("[utterance] onerror fired", {
          myKey,
          error: event.error,
          boundaries: boundaryCount,
        });
        clearKeepAlive();
        clearPrepareTimer();
        utteranceRef.current = null;
        const errType = event.error;
        // `interrupted` / `canceled` fire on stop() or on a new speak() that
        // pre-empts us — not a real error.
        if (errType === "interrupted" || errType === "canceled") {
          if (activeKeyRef.current === myKey) {
            setActive(null);
            setStatus("idle");
          }
          return;
        }
        setError(typeof errType === "string" && errType.length > 0 ? errType : "speech-error");
        setStatus("error");
        clearErrorTimer();
        errorTimerRef.current = setTimeout(() => {
          setStatus("idle");
          setError(null);
          setActive(null);
          errorTimerRef.current = null;
        }, 1800);
      };

      utteranceRef.current = utterance;
      setError(null);
      setActive(myKey);
      setStatus("preparing");
      ttsLog("[speak] state → preparing, activeKey=", myKey);

      const wasBusy = synth.speaking || synth.pending;
      ttsLog("[speak] wasBusy=", wasBusy);
      if (wasBusy) {
        try {
          synth.cancel();
          ttsLog("[speak] pre-cancel ok");
        } catch (err) {
          ttsLog("[speak] pre-cancel threw (benign)", err);
        }
      }
      // Some browsers leave the engine in a paused state after a prior
      // navigation — a no-op resume() clears it.
      if (synth.paused) {
        try {
          synth.resume();
          ttsLog("[speak] paused-state resume() ok");
        } catch (err) {
          ttsLog("[speak] paused-state resume() threw (benign)", err);
        }
      }

      const launch = () => {
        ttsLog("[launch] about to call synth.speak", {
          myKey,
          speaking: synth.speaking,
          pending: synth.pending,
          paused: synth.paused,
        });
        try {
          synth.speak(utterance);
          ttsLog("[launch] synth.speak returned; state now", {
            speaking: synth.speaking,
            pending: synth.pending,
          });
        } catch (err) {
          ttsLog("[launch] synth.speak THREW", err);
          utteranceRef.current = null;
          setStatus("error");
          setActive(null);
          setError(err instanceof Error ? err.message : "speech-error");
          clearErrorTimer();
          errorTimerRef.current = setTimeout(() => {
            setStatus("idle");
            setError(null);
            errorTimerRef.current = null;
          }, 1800);
          return;
        }

        // Watchdog: if the engine never fires `onstart` (seen on some
        // Chromium builds when the user immediately pre-empts an in-flight
        // utterance) fall back to idle after a few seconds rather than
        // leaving the spinner up forever.
        prepareTimerRef.current = setTimeout(() => {
          prepareTimerRef.current = null;
          ttsLog("[watchdog] 4s elapsed; checking state", {
            myKey,
            sameUtterance: utteranceRef.current === utterance,
            speaking: synth.speaking,
            pending: synth.pending,
          });
          if (utteranceRef.current !== utterance) return;
          if (synth.speaking) return; // engine did start, just never called onstart
          ttsLog("[watchdog] no onstart, no speaking — cancelling & resetting");
          try {
            synth.cancel();
          } catch (err) {
            ttsLog("[watchdog] cancel threw (benign)", err);
          }
          utteranceRef.current = null;
          if (activeKeyRef.current === myKey) {
            setActive(null);
            setStatus("idle");
            setError(null);
          }
        }, 4000);
      };

      // Chrome drops a `speak()` issued in the same tick as a `cancel()`.
      // Only delay when we actually cancelled something — a fresh first
      // click runs synchronously so the gesture check still passes.
      if (wasBusy) {
        ttsLog("[speak] scheduling launch +30ms (was busy, avoid cancel/speak race)");
        setTimeout(launch, 30);
      } else {
        ttsLog("[speak] launching synchronously (preserves user gesture)");
        launch();
      }

      // Kick voice loading in the background so the next click can bind a
      // matching voice — we don't retrofit this utterance (the engine
      // ignores voice changes once `speak()` has queued).
      if (currentVoices.length === 0) {
        ttsLog("[speak] voices empty — kicking off loadVoices()");
        void loadVoices().then((list) => {
          ttsLog("[speak] loadVoices resolved", { count: list.length });
        });
      }

      return Promise.resolve();
    },
    [clearErrorTimer, clearPrepareTimer, clearKeepAlive, loadVoices, setActive],
  );

  // Tear down on unmount — the provider sits near the app root, so this
  // really only runs on a hot-reload or full unmount.
  useEffect(() => {
    const listeners = listenersRef.current;
    return () => {
      clearErrorTimer();
      clearPrepareTimer();
      clearKeepAlive();
      if (typeof window !== "undefined") {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
      listeners.clear();
    };
  }, [clearErrorTimer, clearPrepareTimer, clearKeepAlive]);

  const value = useMemo<Speaker>(
    () => ({ status, error, activeKey, supported, speak, stop, onBoundary }),
    [status, error, activeKey, supported, speak, stop, onBoundary],
  );

  return <SpeakerContext.Provider value={value}>{children}</SpeakerContext.Provider>;
}

// Defensive stable fallback — a provider-less render (tests, SSR) should
// not crash and should not hand out a new object each call.
const INERT_SPEAKER: Speaker = {
  status: "idle",
  error: null,
  activeKey: null,
  supported: false,
  speak: async () => {},
  stop: () => {},
  onBoundary: () => () => {},
};

/**
 * Read from the singleton `SpeakerProvider`. The shape is preserved from
 * the older per-component hook so callers that do not care about the
 * `activeKey` can keep reading `status`/`error`/`speak`/`stop` as before.
 */
export function useSpeaker(): Speaker {
  return useContext(SpeakerContext) ?? INERT_SPEAKER;
}
