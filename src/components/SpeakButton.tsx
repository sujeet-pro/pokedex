import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Tooltip } from "radix-ui";
import {
  abilityBundleQuery,
  berryBundleQuery,
  generationBundleQuery,
  itemBundleQuery,
  locationBundleQuery,
  moveBundleQuery,
  pokemonBundleQuery,
  pokemonSummaryQuery,
} from "~/api/queries";
import { usePreferences } from "~/hooks/usePreferences";
import { pickVoice, useVoices } from "~/hooks/useVoices";
import type { AbilityBundle } from "~/types/bundles";
import { titleCase } from "~/utils/formatters";
import {
  berryNarrative,
  generationNarrative,
  itemNarrative,
  locationNarrative,
  moveNarrative,
  pokemonNarrative,
} from "~/utils/narrative";
import { summarizeWithAi } from "~/utils/aiSummarize";
import "~/styles/components/SpeakButton.css";

export type SpeakKind = "pokemon" | "berry" | "item" | "move" | "location" | "generation";

type Props = {
  kind: SpeakKind;
  /** URL-param style identifier (the entry's name). */
  name: string;
  /** Display label for a11y — usually the same as `name` title-cased. */
  displayName?: string;
};

type Status = "idle" | "preparing" | "speaking" | "error";

const LABELS: Record<Status, string> = {
  idle: "Read aloud",
  preparing: "Preparing…",
  speaking: "Stop reading",
  error: "Retry reading",
};

export function SpeakButton({ kind, name, displayName }: Props) {
  const qc = useQueryClient();
  const { prefs } = usePreferences();
  const voices = useVoices();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortRef = useRef(false);

  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (!supported) return;
    return () => {
      abortRef.current = true;
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  // If the entry changes (route change), cancel any in-flight speech so the
  // narrator doesn't keep reading about the previous one.
  useEffect(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setStatus("idle");
  }, [kind, name, supported]);

  const handleClick = useCallback(async () => {
    if (!supported) return;
    if (status === "speaking") {
      window.speechSynthesis.cancel();
      setStatus("idle");
      return;
    }

    setStatus("preparing");
    setErrorMessage(null);
    abortRef.current = false;

    try {
      const spokenText = await resolveSpokenText({ kind, name, qc });
      if (abortRef.current) return;

      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.lang = "en-US";
      const voice = pickVoice(voices, prefs.voice);
      if (voice) utterance.voice = voice;

      utterance.addEventListener("start", () => setStatus("speaking"));
      utterance.addEventListener("end", () => setStatus("idle"));
      utterance.addEventListener("error", (event) => {
        const err = (event as SpeechSynthesisErrorEvent).error;
        if (err === "interrupted" || err === "canceled") {
          setStatus("idle");
          return;
        }
        setStatus("error");
        setErrorMessage(`Speech failed (${err ?? "unknown"})`);
      });

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      setStatus("error");
      setErrorMessage(e instanceof Error ? e.message : "Unknown error");
    }
  }, [qc, kind, name, status, supported, voices, prefs.voice]);

  if (!supported) return null;

  const label = LABELS[status];
  const display = displayName ?? titleCase(name);
  const statusMessage =
    status === "preparing"
      ? "Preparing voiceover…"
      : status === "speaking"
        ? "Reading entry"
        : status === "error"
          ? (errorMessage ?? "Something went wrong.")
          : "";

  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            className={`speak-bezel speak-bezel--${status}`}
            onClick={handleClick}
            disabled={status === "preparing"}
            aria-label={`${label} — ${display}`}
            aria-describedby={`speak-bezel-status-${kind}-${name}`}
          >
            <SpeakIcon status={status} />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="speak-bezel__tip"
            side="bottom"
            sideOffset={8}
            collisionPadding={10}
          >
            {label}
            <Tooltip.Arrow className="speak-bezel__tip-arrow" width={10} height={5} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
      <span
        id={`speak-bezel-status-${kind}-${name}`}
        className="visually-hidden"
        role="status"
        aria-live="polite"
      >
        {statusMessage}
      </span>
    </Tooltip.Provider>
  );
}

type QC = ReturnType<typeof useQueryClient>;

async function resolveSpokenText(opts: {
  kind: SpeakKind;
  name: string;
  qc: QC;
}): Promise<string> {
  const { kind, name, qc } = opts;

  if (kind === "pokemon") {
    const bundle = await qc.ensureQueryData(pokemonBundleQuery(name));

    // Prefer the committed server-side summary when available — it reads best
    // and we already paid for it. Fall back to browser AI otherwise.
    if (bundle.has_summary) {
      try {
        const text = await qc.ensureQueryData(pokemonSummaryQuery(bundle.id));
        const trimmed = text.trim();
        if (trimmed) return trimmed;
      } catch {
        /* fall through to browser AI */
      }
    }

    const abilities = await Promise.all(
      bundle.abilities.map((a) =>
        qc.ensureQueryData(abilityBundleQuery(a.name)).catch(() => null),
      ),
    );
    const narrative = pokemonNarrative(
      bundle,
      abilities.filter(Boolean) as AbilityBundle[],
    );
    const ai = await summarizeWithAi(narrative.richContext, narrative.systemPrompt);
    return ai.source === "fallback" ? narrative.friendlyFallback : ai.text;
  }

  if (kind === "berry") {
    const b = await qc.ensureQueryData(berryBundleQuery(name));
    const narrative = berryNarrative(b);
    const ai = await summarizeWithAi(narrative.richContext, narrative.systemPrompt);
    return ai.source === "fallback" ? narrative.friendlyFallback : ai.text;
  }

  if (kind === "item") {
    const i = await qc.ensureQueryData(itemBundleQuery(name));
    const narrative = itemNarrative(i);
    const ai = await summarizeWithAi(narrative.richContext, narrative.systemPrompt);
    return ai.source === "fallback" ? narrative.friendlyFallback : ai.text;
  }

  if (kind === "move") {
    const m = await qc.ensureQueryData(moveBundleQuery(name));
    const narrative = moveNarrative(m);
    const ai = await summarizeWithAi(narrative.richContext, narrative.systemPrompt);
    return ai.source === "fallback" ? narrative.friendlyFallback : ai.text;
  }

  if (kind === "location") {
    const l = await qc.ensureQueryData(locationBundleQuery(name));
    const narrative = locationNarrative(l);
    const ai = await summarizeWithAi(narrative.richContext, narrative.systemPrompt);
    return ai.source === "fallback" ? narrative.friendlyFallback : ai.text;
  }

  // generation
  const g = await qc.ensureQueryData(generationBundleQuery(name));
  const narrative = generationNarrative(g);
  const ai = await summarizeWithAi(narrative.richContext, narrative.systemPrompt);
  return ai.source === "fallback" ? narrative.friendlyFallback : ai.text;
}

function SpeakIcon({ status }: { status: Status }) {
  if (status === "speaking") {
    return (
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        aria-hidden="true"
        className="speak-bezel__icon speak-bezel__icon--stop"
      >
        <rect x="5" y="5" width="14" height="14" rx="1.5" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      className={`speak-bezel__icon${status === "preparing" ? " speak-bezel__icon--spin" : ""}`}
    >
      <path
        d="M3 10v4a1 1 0 0 0 1 1h3l4 3.5a1 1 0 0 0 1.7-.75V6.25A1 1 0 0 0 11 5.5L7 9H4a1 1 0 0 0-1 1z"
        fill="currentColor"
      />
      <path
        d="M15.5 8.5a5 5 0 0 1 0 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M18 5.5a9 9 0 0 1 0 13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
