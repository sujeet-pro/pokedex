import type { Locale } from "~/types/locales";
import { makeT } from "~/i18n";

type Props = { locale: Locale };

export function Footer({ locale }: Props) {
  const t = makeT(locale);
  return (
    <footer className="footer">
      <small>{t("footer_attribution")}</small>
    </footer>
  );
}
