import { Link } from "@tanstack/react-router";

type Props = { name: string; asLink?: boolean };

export function TypeBadge({ name, asLink = true }: Props) {
  const className = `type-badge type-badge--${name}`;
  if (!asLink) return <span className={className}>{name}</span>;
  return (
    <Link
      to="/type/$id"
      params={{ id: name }}
      className={className}
      aria-label={`View ${name} type`}
    >
      {name}
    </Link>
  );
}
