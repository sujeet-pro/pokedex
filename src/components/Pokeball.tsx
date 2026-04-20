import type { SVGProps } from "react";

/**
 * Simple flat pokéball glyph — uses currentColor for the outline and ring so
 * it inherits whatever colour the surrounding text uses. Top half filled red
 * (actually `--brand-accent` via CSS), bottom half transparent (just outline).
 */
export function Pokeball({
  size = 24,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {/* top hemisphere — filled */}
      <path
        d="M12 2a10 10 0 0 1 9.9 9H15a3 3 0 1 0-6 0H2.1A10 10 0 0 1 12 2Z"
        fill="currentColor"
      />
      {/* bottom hemisphere — outlined */}
      <path
        d="M2.1 13H9a3 3 0 0 0 6 0h6.9a10 10 0 0 1-19.8 0Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      {/* equator */}
      <path
        d="M2.1 11.5h6.9m6 0h6.9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* center ring */}
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" />
    </svg>
  );
}
