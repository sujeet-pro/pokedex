import { useEffect, useState } from "react";

/**
 * SSR-safe hook returning the list of available SpeechSynthesisVoice entries.
 * Subscribes to `voiceschanged` so late-loading voices appear once ready.
 */
export function useVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;

    const update = () => {
      setVoices(synth.getVoices());
    };

    update();
    synth.addEventListener("voiceschanged", update);
    return () => {
      synth.removeEventListener("voiceschanged", update);
    };
  }, []);

  return voices;
}
