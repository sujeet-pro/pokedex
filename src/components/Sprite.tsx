type Props = {
  src: string | null | undefined;
  alt: string;
  size?: number;
  priority?: boolean;
};

const FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'>
      <circle cx='48' cy='48' r='44' fill='none' stroke='currentColor' stroke-width='2' opacity='.35'/>
      <path d='M4 48h88' stroke='currentColor' stroke-width='2' opacity='.35'/>
      <circle cx='48' cy='48' r='10' fill='currentColor' opacity='.25'/>
    </svg>`,
  );

export function Sprite({ src, alt, size = 192, priority = false }: Props) {
  return (
    <img
      src={src || FALLBACK}
      alt={alt}
      width={size}
      height={size}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = FALLBACK;
      }}
    />
  );
}
