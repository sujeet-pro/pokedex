import type { ReactNode } from "react";
import { Popover } from "radix-ui";

type Props = {
  /** Title rendered inside the popover head. */
  title?: string;
  /** Optional monospaced sub-title (e.g. "LOCATION · AREA"). */
  sub?: string;
  /** Short summary paragraph. */
  summary?: string;
  /** Flavor / descriptive text rendered as text fragment or HTML. */
  description?: string;
  /** HTML body; when provided, overrides `description`. */
  html?: string;
  /** Popover trigger element. */
  children: ReactNode;
};

/**
 * Generic info popover. Wraps Radix Popover with the `.info-pop*` class
 * vocabulary from console.css. The trigger is rendered via `asChild` so the
 * consumer can decorate it (icon button, inline link, dossier field, etc.).
 */
export function InfoPopover({ title, sub, summary, description, html, children }: Props) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="info-pop"
          sideOffset={8}
          collisionPadding={12}
          align="start"
        >
          <div className="info-pop__head">
            <div className="info-pop__titles">
              {title ? <p className="info-pop__title">{title}</p> : null}
              {sub ? <p className="info-pop__sub">{sub}</p> : null}
            </div>
            <Popover.Close className="info-pop__close" aria-label="Close">
              ×
            </Popover.Close>
          </div>
          <div className="info-pop__body">
            {summary ? <p className="info-pop__summary">{summary}</p> : null}
            {html ? (
              <div
                className="info-pop__text"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : description ? (
              <p className="info-pop__text">{description}</p>
            ) : null}
          </div>
          <Popover.Arrow className="info-pop__arrow" width={14} height={7} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
