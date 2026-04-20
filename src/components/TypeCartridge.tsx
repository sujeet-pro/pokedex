import { typeInfo } from "~/lib/typeInfo";

type Props = { name: string };

export function TypeCartridge({ name }: Props) {
  const info = typeInfo(name);
  return (
    <span
      className="type-pill"
      style={{ "--type-color": info.color, color: info.textColor } as React.CSSProperties}
      data-type={name}
    >
      {name}
    </span>
  );
}
