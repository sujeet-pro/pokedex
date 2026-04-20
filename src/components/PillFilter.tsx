import "~/styles/components/PillFilter.css";

type Option = {
  value: string;
  label: string;
};

type Props = {
  label: string;
  options: Option[];
  value: string;
  onChange: (next: string) => void;
  /** When true, options also include an "All" pill at the start. Defaults to true. */
  includeAll?: boolean;
};

export function PillFilter({ label, options, value, onChange, includeAll = true }: Props) {
  const allOptions = includeAll ? [{ value: "", label: "All" }, ...options] : options;

  return (
    <fieldset className="pill-filter">
      <legend className="pill-filter__label">{label}</legend>
      <div className="pill-filter__options" role="radiogroup" aria-label={label}>
        {allOptions.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              className={`pill-filter__pill${active ? " pill-filter__pill--active" : ""}`}
              onClick={() => onChange(opt.value)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
