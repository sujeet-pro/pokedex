import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Tooltip } from "radix-ui";
import { abilityQuery, pokemonQuery, speciesQuery, typeQuery } from "~/api/queries";
import { usePreferences } from "~/hooks/usePreferences";
import { pickVoice, useVoices } from "~/hooks/useVoices";
import type { AbilityDetail, Pokemon, PokemonSpecies, TypeDetail } from "~/types/pokeapi";
import { cleanFlavor, englishEntry, titleCase } from "~/utils/formatters";
import { summarizeWithAi } from "~/utils/aiSummarize";
import "~/styles/components/SpeakButton.css";

type Props = {
  /** URL-param style identifier (name or id). The component fetches everything it needs itself. */
  pokemonName: string;
  /** Display label for a11y — usually the same as `pokemonName` title-cased. */
  displayName?: string;
};

type Status = "idle" | "preparing" | "speaking" | "error";

const LABELS: Record<Status, string> = {
  idle: "Read aloud",
  preparing: "Preparing…",
  speaking: "Stop reading",
  error: "Retry reading",
};

export function SpeakButton({ pokemonName, displayName }: Props) {
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

  // If the Pokémon changes (route change), cancel any in-flight speech so the
  // narrator doesn't keep reading about the previous one.
  useEffect(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setStatus("idle");
  }, [pokemonName, supported]);

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
      const pokemon = await qc.ensureQueryData(pokemonQuery(pokemonName));
      const [species, defenders, abilityDetails] = await Promise.all([
        qc.ensureQueryData(speciesQuery(pokemon.species.name)).catch(() => undefined),
        Promise.all(pokemon.types.map((t) => qc.ensureQueryData(typeQuery(t.type.name)))),
        Promise.all(pokemon.abilities.map((a) => qc.ensureQueryData(abilityQuery(a.ability.name)))),
      ]);

      if (abortRef.current) return;

      const narrative = buildNarrativeContext({
        pokemon,
        species,
        defenders,
        abilityDetails,
      });
      const aiResult = await summarizeWithAi(narrative.richContext);
      const spokenText =
        aiResult.source === "fallback" ? narrative.friendlyFallback : aiResult.text;

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
        // "interrupted" / "canceled" fire when the user stops or navigates away.
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
  }, [qc, pokemonName, status, supported, voices, prefs.voice]);

  if (!supported) return null;

  const label = LABELS[status];
  const display = displayName ?? titleCase(pokemonName);
  const statusMessage =
    status === "preparing"
      ? "Summarising entry on device…"
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
            aria-describedby="speak-bezel-status"
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
      <span id="speak-bezel-status" className="visually-hidden" role="status" aria-live="polite">
        {statusMessage}
      </span>
    </Tooltip.Provider>
  );
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

// ── narrative builder ────────────────────────────────────────────────────

type NarrativeResult = {
  /** Rich structured prompt for the on-device model. */
  richContext: string;
  /** Conversational fallback when no AI is available. */
  friendlyFallback: string;
};

function buildNarrativeContext({
  pokemon,
  species,
  defenders,
  abilityDetails,
}: {
  pokemon: Pokemon;
  species: PokemonSpecies | undefined;
  defenders: TypeDetail[];
  abilityDetails: AbilityDetail[];
}): NarrativeResult {
  const name = titleCase(pokemon.name);
  const types = pokemon.types.map((t) => titleCase(t.type.name));
  const genus = species ? englishEntry(species.genera)?.genus : undefined;
  const flavor = species ? englishEntry(species.flavor_text_entries)?.flavor_text : undefined;
  const cleanedFlavor = flavor ? cleanFlavor(flavor) : undefined;

  const habitat = species?.habitat ? titleCase(species.habitat.name) : undefined;

  const abilityLines = abilityDetails
    .map((a) => {
      const ee = englishEntry(a.effect_entries);
      const summary = ee?.short_effect ?? ee?.effect;
      return summary ? `${titleCase(a.name)} — ${summary}` : titleCase(a.name);
    })
    .filter(Boolean);

  const weakTo = new Set<string>();
  for (const def of defenders) {
    for (const w of def.damage_relations.double_damage_from) weakTo.add(titleCase(w.name));
  }

  const rarityBits: string[] = [];
  if (species?.is_legendary) rarityBits.push("legendary");
  if (species?.is_mythical) rarityBits.push("mythical");
  if (species?.is_baby) rarityBits.push("a baby Pokémon");

  // Rich prompt — includes everything we know so the on-device AI can pick what
  // to highlight. We explicitly tell the model not to read numbers.
  const richContext = [
    `Name: ${name}.`,
    genus ? `Category: ${genus}.` : "",
    `Type: ${types.join(" and ")}.`,
    rarityBits.length ? `Rarity: ${rarityBits.join(", ")}.` : "",
    habitat ? `Habitat: ${habitat}.` : "",
    cleanedFlavor ? `Dex entry: ${cleanedFlavor}` : "",
    abilityLines.length ? `Abilities: ${abilityLines.join("; ")}.` : "",
    weakTo.size > 0 ? `Commonly weak to: ${[...weakTo].join(", ")}.` : "",
  ]
    .filter(Boolean)
    .join("\n");

  // Conversational fallback — used when the AI tier returns `fallback` so we
  // still get something that sounds natural when read aloud.
  const typePhrase =
    types.length === 2 ? `a ${types[0]} and ${types[1]} type` : `a ${types[0]} type`;
  const fallbackParts: string[] = [];
  fallbackParts.push(
    genus
      ? `This is ${name}, the ${genus.toLowerCase()}, ${typePhrase} Pokémon.`
      : `This is ${name}, ${typePhrase} Pokémon.`,
  );
  if (cleanedFlavor) fallbackParts.push(cleanedFlavor);
  if (abilityLines.length === 1) {
    fallbackParts.push(`Its ability is ${abilityLines[0].split(" — ")[0]}.`);
  } else if (abilityLines.length > 1) {
    const names = abilityLines.map((l) => l.split(" — ")[0]);
    fallbackParts.push(`It can have abilities like ${names.join(" or ")}.`);
  }
  if (rarityBits.length) {
    fallbackParts.push(`It is considered ${rarityBits.join(" and ")}.`);
  }

  const friendlyFallback = fallbackParts.join(" ");

  return { richContext, friendlyFallback };
}
