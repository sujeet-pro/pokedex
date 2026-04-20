import { Popover } from "radix-ui";
import type { BundleAbilityEntry } from "~/types/bundles";
import type { Locale } from "~/types/locales";
import { Link } from "@tanstack/react-router";

type Props = {
  ability: BundleAbilityEntry;
  locale: Locale;
};

/**
 * Button → popover showing the ability's localized short_effect_html.
 * Uses the `.ability-btn*` vocabulary from console.css.
 */
export function AbilityButton({ ability, locale }: Props) {
  const cls = `ability-btn ${ability.is_hidden ? "ability-btn--hidden" : "ability-btn--std"}`;
  const tag = ability.is_hidden ? "Hidden" : `#${ability.slot}`;

  return (
    <Popover.Root>
      <Popover.Trigger className={cls} aria-label={ability.display_name}>
        <span className="ability-btn__name">{ability.display_name}</span>
        <span className="ability-btn__tag">{tag}</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="info-pop" sideOffset={8} collisionPadding={12} align="start">
          <div className="info-pop__head">
            <div className="info-pop__titles">
              <p className="info-pop__title">{ability.display_name}</p>
              <p className="info-pop__sub">{tag}</p>
            </div>
            <Popover.Close className="info-pop__close" aria-label="Close">
              ×
            </Popover.Close>
          </div>
          <div className="info-pop__body">
            {ability.short_effect_html ? (
              <div
                className="info-pop__text"
                dangerouslySetInnerHTML={{ __html: ability.short_effect_html }}
              />
            ) : null}
          </div>
          <div className="info-pop__foot">
            <Link
              to="/$lang/ability/$name"
              params={{ lang: locale, name: ability.name }}
              className="info-pop__link"
            >
              Open ability →
            </Link>
          </div>
          <Popover.Arrow className="info-pop__arrow" width={14} height={7} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
