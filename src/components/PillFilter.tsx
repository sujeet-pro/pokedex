type Option = { value: string; label: string };

type Props = {
  options: Option[];
  selected: string[];
  onChange: (next: string[]) => void;
  /** Optional aria-label for the toggle group. */
  ariaLabel?: string;
};

/**
 * Horizontal toggle-button row using `.pill-button` + `aria-pressed`.
 * Clicking a pill toggles its value in the selected array.
 */
export function PillFilter({ options, selected, onChange, ariaLabel }: Props) {
  function toggle(value: string) {
    const set = new Set(selected);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    onChange(Array.from(set));
  }

  return (
    <div className="hud-actions" role="group" aria-label={ariaLabel}>
      {options.map((opt) => {
        const pressed = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            className="pill-button"
            aria-pressed={pressed}
            onClick={() => toggle(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
