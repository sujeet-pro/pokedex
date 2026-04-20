import { useEffect, useState } from "react";

export function useVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
    return window.speechSynthesis.getVoices();
  });

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const update = () => setVoices(window.speechSynthesis.getVoices());
    update();
    window.speechSynthesis.addEventListener("voiceschanged", update);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", update);
  }, []);

  return voices;
}

export function pickVoice(
  voices: SpeechSynthesisVoice[],
  preferredName?: string | null,
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  if (preferredName) {
    const match = voices.find((v) => v.name === preferredName);
    if (match) return match;
  }
  const natural = voices.find((v) =>
    /Neural|Natural|Google US English|Samantha|Daniel|Aria|Jenny|Libby/i.test(v.name),
  );
  if (natural) return natural;
  const english = voices.find((v) => v.lang.toLowerCase().startsWith("en"));
  return english ?? voices[0] ?? null;
}
