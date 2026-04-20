import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  headerAction?: ReactNode;
  children: ReactNode;
  ariaLabel?: string;
};

export function ConsoleDevice({ title, subtitle, headerAction, children, ariaLabel }: Props) {
  return (
    <section className="device" aria-label={ariaLabel ?? title}>
      <div className="device__rivets" aria-hidden>
        <span /><span /><span /><span />
      </div>
      <header className="device__head">
        <div className="device__leds" aria-hidden>
          <span className="led led--blue" />
          <span className="led led--red led--tiny" />
          <span className="led led--yellow led--tiny" />
        </div>
        <div className="device__title">
          {title}
          {subtitle ? <span className="device__title-sub">{subtitle}</span> : null}
        </div>
        <div className="device__head-action">{headerAction}</div>
      </header>
      <div className="device__screen">{children}</div>
      <footer className="device__foot" aria-hidden>
        <div className="device__dpad" />
        <div className="device__speaker">
          <span /><span /><span /><span />
          <span /><span /><span /><span />
        </div>
        <div className="device__ab">
          <span className="device__btn">A</span>
          <span className="device__btn device__btn--b">B</span>
        </div>
      </footer>
    </section>
  );
}
