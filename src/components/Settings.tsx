import { useMemo } from "react";
import { Popover, ToggleGroup, VisuallyHidden } from "radix-ui";
import {
  type Dir,
  type Mode,
  type Scale,
  type Theme,
  usePreferences,
} from "~/hooks/usePreferences";
import { useVoices } from "~/hooks/useVoices";

const THEMES: Theme[] = ["blue", "yellow", "red"];
const SCALES: Scale[] = ["xs", "sm", "md", "lg", "xl"];
const MODES: Mode[] = ["light", "dark"];
const DIRS: Dir[] = ["ltr", "rtl"];

export function SettingsMenu() {
  const { prefs, setTheme, setMode, setScale, setDir, setVoice } = usePreferences();
  const voices = useVoices();

  const speechSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  const englishVoices = useMemo(
    () => voices.filter((v) => v.lang.toLowerCase().startsWith("en")),
    [voices],
  );
  const voiceList = englishVoices.length > 0 ? englishVoices : voices;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button type="button" className="pill-button" aria-label="Display settings">
          <span aria-hidden="true">⚙︎</span> Settings
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="settings" sideOffset={6} align="end" collisionPadding={8}>
          <VisuallyHidden.Root>
            <h2>Display settings</h2>
          </VisuallyHidden.Root>

          <div className="settings__row">
            <label className="settings__label" id="lbl-theme">
              Theme
            </label>
            <ToggleGroup.Root
              type="single"
              value={prefs.theme}
              onValueChange={(v) => v && setTheme(v as Theme)}
              aria-labelledby="lbl-theme"
              className="control-group"
            >
              {THEMES.map((t) => (
                <ToggleGroup.Item key={t} value={t} aria-label={`${t} theme`}>
                  {t}
                </ToggleGroup.Item>
              ))}
            </ToggleGroup.Root>
          </div>

          <div className="settings__row">
            <label className="settings__label" id="lbl-mode">
              Mode
            </label>
            <ToggleGroup.Root
              type="single"
              value={prefs.mode}
              onValueChange={(v) => v && setMode(v as Mode)}
              aria-labelledby="lbl-mode"
              className="control-group"
            >
              {MODES.map((m) => (
                <ToggleGroup.Item key={m} value={m} aria-label={`${m} mode`}>
                  {m}
                </ToggleGroup.Item>
              ))}
            </ToggleGroup.Root>
          </div>

          <div className="settings__row">
            <label className="settings__label" id="lbl-scale">
              Text size
            </label>
            <ToggleGroup.Root
              type="single"
              value={prefs.scale}
              onValueChange={(v) => v && setScale(v as Scale)}
              aria-labelledby="lbl-scale"
              className="control-group"
            >
              {SCALES.map((s) => (
                <ToggleGroup.Item key={s} value={s} aria-label={`text size ${s}`}>
                  {s.toUpperCase()}
                </ToggleGroup.Item>
              ))}
            </ToggleGroup.Root>
          </div>

          <div className="settings__row">
            <label className="settings__label" id="lbl-dir">
              Direction
            </label>
            <ToggleGroup.Root
              type="single"
              value={prefs.dir}
              onValueChange={(v) => v && setDir(v as Dir)}
              aria-labelledby="lbl-dir"
              className="control-group"
            >
              {DIRS.map((d) => (
                <ToggleGroup.Item key={d} value={d} aria-label={`${d} direction`}>
                  {d.toUpperCase()}
                </ToggleGroup.Item>
              ))}
            </ToggleGroup.Root>
          </div>

          {speechSupported && (
            <div className="settings__row">
              <label className="settings__label" htmlFor="voice-select">
                Speech voice
              </label>
              <select
                id="voice-select"
                className="settings__select"
                value={prefs.voice ?? ""}
                onChange={(e) => setVoice(e.target.value || null)}
                disabled={voiceList.length === 0}
              >
                <option value="">Auto · pick best available</option>
                {voiceList.map((v) => (
                  <option key={`${v.name}-${v.lang}`} value={v.name}>
                    {v.name} ({v.lang}){v.localService ? "" : " · network"}
                  </option>
                ))}
              </select>
              <small className="settings__hint">
                Used by the speaker button on entry pages. Voices come from your browser / OS.
              </small>
            </div>
          )}

          <Popover.Arrow className="settings__arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
