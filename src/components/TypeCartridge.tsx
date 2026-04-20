import { typeInfo } from "~/lib/typeInfo";
import type { Locale } from "~/types/locales";

type Props = {
  name: string;
  locale?: Locale;
  size?: "md" | "sm";
  asLink?: boolean;
};

function buildUrl(base: string, lang: Locale, name: string): string {
  return `${base}${lang}/type/${name}`;
}

export function TypeCartridge({ name, locale, size = "md", asLink = false }: Props) {
  const info = typeInfo(name);
  const className = `cart${size === "sm" ? " cart--sm" : ""}`;
  const content = (
    <>
      <span className="cart__chip" style={{ background: info.color }} aria-hidden />
      <span>{name}</span>
    </>
  );
  if (asLink && locale) {
    const href = buildUrl(import.meta.env.BASE_URL, locale, name);
    return (
      <a href={href} className={className} data-type={name}>
        {content}
      </a>
    );
  }
  return (
    <span className={className} data-type={name}>
      {content}
    </span>
  );
}
