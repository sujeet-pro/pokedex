type Props = {
  src: string | null | undefined;
  alt: string;
  priority?: boolean;
  width?: number;
  height?: number;
};

export function Sprite({ src, alt, priority, width, height }: Props) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      width={width}
      height={height}
      {...(priority ? { fetchPriority: "high" as const } : {})}
    />
  );
}
