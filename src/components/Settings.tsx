import { Popover, ToggleGroup } from "radix-ui";
import type { Locale } from "~/types/locales";
import { makeT } from "~/i18n";
import { usePreferences } from "~/hooks/usePreferences";
import { useVoices } from "~/hooks/useVoices";
import { LocaleSwitcher } from "./LocaleSwitcher";
import type {
  Direction,
  Mode,
  Scale,
  Theme,
} from "~/lib/preferences";

type Props = { locale: Locale };

const THEME_VALUES: Theme[] = ["red", "blue", "yellow"];
const MODE_VALUES: Mode[] = ["light", "dark"];
const SCALE_VALUES: Scale[] = ["xs", "sm", "md", "lg", "xl"];
const DIR_VALUES: Direction[] = ["ltr", "rtl"];

export function Settings({ locale }: Props) {
  const t = makeT(locale);
  const { prefs, setPref } = usePreferences();
  const voices = useVoices();
  const langPrefix = locale === "fr" ? "fr" : "en";
  const localeVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix));

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="pill-button"
          aria-label={t("settings_title")}
        >
          {t("settings_title")}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="settings"
          align="end"
          sideOffset={8}
          aria-label={t("settings_title")}
        >
          <div className="settings__row">
            <span className="settings__label">
              {t("settings_language")}
            </span>
            <LocaleSwitcher locale={locale} />
          </div>

          <div className="settings__row">
            <label className="settings__label" id="settings-theme-label">
              {t("settings_theme")}
            </label>
            <ToggleGroup.Root
              type="single"
              value={prefs.theme}
              onValueChange={(v) => {
                if (v && (THEME_VALUES as string[]).includes(v)) setPref("theme", v as Theme);
              }}
              className="control-group"
              aria-labelledby="settings-theme-label"
            >
              {THEME_VALUES.map((val) => (
                <ToggleGroup.Item key={val} value={val} aria-label={t(`theme_${val}` as const)}>
                  {t(`theme_${val}` as const)}
                </ToggleGroup.Item>
              ))}
            </ToggleGroup.Root>
          </div>

          <div className="settings__row">
            <label className="settings__label" id="settings-mode-label">
              {t("settings_mode")}
            </label>
            <ToggleGroup.Root
              type="single"
              value={prefs.mode}
              onValueChange={(v) => {
                if (v && (MODE_VALUES as string[]).includes(v)) setPref("mode", v as Mode);
              }}
              className="control-group"
              aria-labelledby="settings-mode-label"
            >
              {MODE_VALUES.map((val) => (
                <ToggleGroup.Item key={val} value={val} aria-label={t(`mode_${val}` as const)}>
                  {t(`mode_${val}` as const)}
                </ToggleGroup.Item>
              ))}
            </ToggleGroup.Root>
          </div>

          <div className="settings__row">
            <label className="settings__label" id="settings-size-label">
              {t("settings_size")}
            </label>
            <ToggleGroup.Root
              type="single"
              value={prefs.scale}
              onValueChange={(v) => {
                if (v && (SCALE_VALUES as string[]).includes(v)) setPref("scale", v as Scale);
              }}
              className="control-group"
              aria-labelledby="settings-size-label"
            >
              {SCALE_VALUES.map((val) => (
                <ToggleGroup.Item key={val} value={val} aria-label={t(`scale_${val}` as const)}>
                  {t(`scale_${val}` as const)}
                </ToggleGroup.Item>
              ))}
            </ToggleGroup.Root>
          </div>

          <div className="settings__row">
            <label className="settings__label" id="settings-dir-label">
              {t("settings_dir")}
            </label>
            <ToggleGroup.Root
              type="single"
              value={prefs.dir}
              onValueChange={(v) => {
                if (v && (DIR_VALUES as string[]).includes(v)) setPref("dir", v as Direction);
              }}
              className="control-group"
              aria-labelledby="settings-dir-label"
            >
              {DIR_VALUES.map((val) => (
                <ToggleGroup.Item key={val} value={val} aria-label={t(`dir_${val}` as const)}>
                  {t(`dir_${val}` as const)}
                </ToggleGroup.Item>
              ))}
            </ToggleGroup.Root>
          </div>

          <div className="settings__row">
            <label className="settings__label" htmlFor="settings-voice-select">
              {t("settings_voice")}
            </label>
            <select
              id="settings-voice-select"
              className="settings__select"
              value={prefs.voice ?? ""}
              onChange={(e) => {
                const v = e.currentTarget.value;
                setPref("voice", v === "" ? null : v);
              }}
            >
              <option value="">{t("voice_auto")}</option>
              {localeVoices.map((v) => (
                <option key={`${v.name}-${v.lang}`} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          <Popover.Arrow className="settings__arrow" width={12} height={6} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
