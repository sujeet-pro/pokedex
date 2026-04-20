import type { ReactNode } from "react";
import "~/styles/components/Console.css";

type Props = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** narrow variant for secondary pages (no D-pad / A-B decoration) */
  variant?: "full" | "compact";
  /** Override aria-label for the region */
  ariaLabel?: string;
  /**
   * Optional interactive element rendered on the top-right of the bezel —
   * replaces the decorative speaker grille. Pages pass a `<SpeakButton/>`
   * here so the action lives on the device body, not inside the screen.
   */
  headerAction?: ReactNode;
};

export function ConsoleDevice({
  title = "POKÉ DEX · SCANNER",
  subtitle,
  children,
  footer,
  variant = "full",
  ariaLabel,
  headerAction,
}: Props) {
  return (
    <section
      className={`device device--${variant}`}
      role="region"
      aria-label={ariaLabel ?? (subtitle ? `${title} — ${subtitle}` : title)}
    >
      <span className="device__rivets" aria-hidden="true">
        <span /> <span /> <span /> <span />
      </span>

      <div className="device__head">
        <div className="device__leds" aria-hidden="true">
          <span className="led led--blue" />
          <span className="led led--red led--tiny" />
          <span className="led led--yellow led--tiny" />
          <span className="led led--yellow led--tiny" />
        </div>
        <div className="device__title">
          <span className="device__title-main">{title}</span>
          {subtitle && <small className="device__title-sub">{subtitle}</small>}
        </div>
        <div className="device__head-action">
          {headerAction ?? (
            <div className="device__speaker" aria-hidden="true">
              <span /> <span /> <span /> <span />
            </div>
          )}
        </div>
      </div>

      <div className="device__screen">{children}</div>

      {footer && <div className="device__foot">{footer}</div>}
    </section>
  );
}
