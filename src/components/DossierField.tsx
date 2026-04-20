import { Popover } from "radix-ui";

type Props = {
  term: string;
  value: string | number;
  description?: string;
  html?: string;
};

/**
 * A single dossier row (term + value) that opens an info popover on click.
 * Uses the `.dossier-field*` and `.info-pop*` class vocabulary from
 * console.css.
 */
export function DossierField({ term, value, description, html }: Props) {
  const hasPop = Boolean(description || html);

  const body = (
    <>
      <span className="dossier-field__term">{term}</span>
      <span className="dossier-field__value">{value === "" ? "—" : value}</span>
    </>
  );

  if (!hasPop) {
    return (
      <div className="dossier-field" aria-label={`${term}: ${value}`}>
        {body}
      </div>
    );
  }

  return (
    <Popover.Root>
      <Popover.Trigger className="dossier-field" aria-label={`${term}: ${value}`}>
        {body}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="info-pop" sideOffset={8} collisionPadding={12} align="start">
          <div className="info-pop__head">
            <div className="info-pop__titles">
              <p className="info-pop__title">{term}</p>
              <p className="info-pop__sub">{String(value)}</p>
            </div>
            <Popover.Close className="info-pop__close" aria-label="Close">
              ×
            </Popover.Close>
          </div>
          <div className="info-pop__body">
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
