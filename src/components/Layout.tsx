import type { ReactNode } from "react";
import type { Locale } from "~/types/locales";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { SkipLink } from "./SkipLink";
import { ErrorBoundary } from "./ErrorBoundary";
import { makeT } from "~/i18n";

type Props = { locale: Locale; children: ReactNode };

export function Layout({ locale, children }: Props) {
  const t = makeT(locale);
  return (
    <div className="app-shell">
      <SkipLink label={t("skip_to_content")} />
      <Navbar locale={locale} />
      <main id="main-content" className="app-main">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
