type Props = { className?: string; title?: string };

export function Pokeball({ className, title }: Props) {
  return (
    <svg
      className={className ? `pokeball ${className}` : "pokeball"}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <circle cx="32" cy="32" r="28" fill="currentColor" opacity="0.15" />
      <path d="M4 32a28 28 0 0 1 56 0H40a8 8 0 1 0-16 0H4Z" fill="currentColor" />
      <circle cx="32" cy="32" r="6" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M4 32a28 28 0 0 0 56 0" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
    </svg>
  );
}
