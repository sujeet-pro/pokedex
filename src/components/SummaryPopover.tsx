import { useCallback, useEffect, useState } from "react";
import { Popover } from "radix-ui";
import type { Locale } from "~/types/locales";
import { useSummary, type NarrativeInput, type SummaryKind } from "~/hooks/useSummary";

const LABELS: Record<
  Locale,
  {
    trigger: string;
    title: string;
    generating: string;
    error: string;
    retry: string;
    empty: string;
    onDevice: string;
  }
> = {
  en: {
    trigger: "Show summary",
    title: "Summary",
    generating: "Generating summary…",
    error: "Could not generate a summary.",
    retry: "Try again",
    empty: "No summary available.",
    onDevice: "On-Device Summary Generation",
  },
  es: {
    trigger: "Ver resumen",
    title: "Resumen",
    generating: "Generando resumen…",
    error: "No se pudo generar el resumen.",
    retry: "Reintentar",
    empty: "No hay resumen disponible.",
    onDevice: "Resumen generado en el dispositivo",
  },
};

type Props = {
  kind: SummaryKind;
  slug: string;
  displayName?: string;
  locale: Locale;
  bundleHtml: string | null;
  narrativeBuilder?: () => NarrativeInput;
};

export function SummaryPopover({
  kind,
  slug,
  displayName,
  locale,
  bundleHtml,
  narrativeBuilder,
}: Props) {
  const labels = LABELS[locale];
  const [open, setOpen] = useState(false);
  const { html, source, isGenerating, error, generate } = useSummary({
    kind,
    slug,
    locale,
    bundleHtml,
    narrativeBuilder,
  });

  useEffect(() => {
    if (open && !html && !isGenerating && !error && narrativeBuilder) {
      void generate();
    }
  }, [open, html, isGenerating, error, generate, narrativeBuilder]);

  const handleRetry = useCallback(() => {
    void generate();
  }, [generate]);

  const ariaLabel = displayName ? `${labels.trigger} — ${displayName}` : labels.trigger;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="speak-bezel"
          aria-label={ariaLabel}
          aria-busy={isGenerating || undefined}
        >
          {isGenerating ? <LoaderIcon /> : <SummaryIcon />}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="info-pop info-pop--summary"
          sideOffset={8}
          collisionPadding={12}
          align="end"
        >
          <div className="info-pop__head">
            <div className="info-pop__titles">
              <p className="info-pop__title">{labels.title}</p>
              {displayName ? <p className="info-pop__sub">{displayName}</p> : null}
            </div>
            <Popover.Close className="info-pop__close" aria-label="Close">
              ×
            </Popover.Close>
          </div>
          <div className="info-pop__body summary-pop__body">
            {isGenerating ? (
              <p className="info-pop__summary" role="status">
                {labels.generating}
              </p>
            ) : error ? (
              <>
                <p className="info-pop__summary">{labels.error}</p>
                <button type="button" className="info-pop__retry" onClick={handleRetry}>
                  {labels.retry}
                </button>
              </>
            ) : html ? (
              <>
                {source === "client" ? (
                  <p className="summary-pop__source">{labels.onDevice}</p>
                ) : null}
                <div
                  className="info-pop__text summary-pop__text"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              </>
            ) : (
              <p className="info-pop__summary">{labels.empty}</p>
            )}
          </div>
          <Popover.Arrow className="info-pop__arrow" width={14} height={7} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function SummaryIcon() {
  return (
    <svg className="speak-bezel__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M6 4h9a3 3 0 0 1 3 3v13a1 1 0 0 1-1.45.89L12 18.6l-4.55 2.29A1 1 0 0 1 6 20V4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9 8h6M9 11h6M9 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function LoaderIcon() {
  return (
    <svg
      className="speak-bezel__icon speak-bezel__icon--spin"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
