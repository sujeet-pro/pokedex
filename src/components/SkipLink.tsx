type Props = { label: string };

export function SkipLink({ label }: Props) {
  return (
    <a href="#main-content" className="skip-link">
      {label}
    </a>
  );
}
