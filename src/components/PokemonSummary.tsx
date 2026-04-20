import { forwardRef } from "react";

type Props = {
  summaryHtml: string | null;
};

/**
 * Renders the pre-tokenised summary HTML (with `<span data-w="N">` word
 * boundaries) that the SpeakButton drives a highlight over. The ref is
 * forwarded so the parent can hand it to `SpeakButton` via
 * `summaryContainerRef`.
 */
export const PokemonSummary = forwardRef<HTMLDivElement, Props>(function PokemonSummary(
  { summaryHtml },
  ref
) {
  if (!summaryHtml) return null;
  return (
    <div
      ref={ref}
      className="hud-flavor summary"
      dangerouslySetInnerHTML={{ __html: summaryHtml }}
    />
  );
});
