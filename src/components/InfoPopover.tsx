import type { ReactNode } from "react";
import { Popover } from "radix-ui";
import "~/styles/components/InfoPopover.css";

type Props = {
  /** Single element used as the click/keyboard target. Radix clones it via `asChild`. */
  trigger: ReactNode;
  title: string;
  subtitle?: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Override the content's accessible name (defaults to "<title> details"). */
  ariaLabel?: string;
};

export function InfoPopover({
  trigger,
  title,
  subtitle,
  meta,
  children,
  footer,
  ariaLabel,
}: Props) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="info-pop"
          sideOffset={8}
          collisionPadding={12}
          align="center"
          aria-label={ariaLabel ?? `${title} details`}
        >
          <header className="info-pop__head">
            <div className="info-pop__titles">
              <h3 className="info-pop__title">{title}</h3>
              {subtitle && <p className="info-pop__sub">{subtitle}</p>}
            </div>
            <Popover.Close className="info-pop__close" aria-label="Close">
              <span aria-hidden="true">×</span>
            </Popover.Close>
          </header>
          {meta && <div className="info-pop__meta">{meta}</div>}
          {children && <div className="info-pop__body">{children}</div>}
          {footer && <footer className="info-pop__foot">{footer}</footer>}
          <Popover.Arrow className="info-pop__arrow" width={14} height={8} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
