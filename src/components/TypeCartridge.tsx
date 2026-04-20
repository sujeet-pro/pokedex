import { Link } from "@tanstack/react-router";
import { typeInfo } from "~/utils/typeInfo";
import "~/styles/components/TypeCartridge.css";

type Props = {
  name: string;
  asLink?: boolean;
  size?: "sm" | "md";
};

export function TypeCartridge({ name, asLink = true, size = "md" }: Props) {
  const info = typeInfo(name);
  const className = `cart cart--${size} cart--${info.name}`;
  const inner = (
    <>
      <span className="cart__chip" aria-hidden="true" style={{ background: info.color }} />
      <span className="cart__label">{info.display}</span>
    </>
  );

  if (!asLink) {
    return (
      <span className={className} aria-label={`${info.display} type`}>
        {inner}
      </span>
    );
  }
  return (
    <Link
      to="/type/$name"
      params={{ name: info.name }}
      className={className}
      aria-label={`View ${info.display} type`}
    >
      {inner}
    </Link>
  );
}
