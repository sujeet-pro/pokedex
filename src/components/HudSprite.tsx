import { Sprite } from "./Sprite";

type Props = {
  src: string | null;
  alt: string;
  priority?: boolean;
};

export function HudSprite({ src, alt, priority }: Props) {
  return (
    <div className="hud-sprite" role="img" aria-label={alt}>
      <div className="hud-sprite__corners" aria-hidden>
        <span /><span /><span /><span />
      </div>
      <Sprite src={src} alt={alt} priority={priority} width={512} height={512} />
    </div>
  );
}
