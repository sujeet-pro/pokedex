import type { ReactNode } from "react";
import type { Locale } from "~/types/locales";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { SkipLink } from "./SkipLink";
import { ErrorBoundary } from "./ErrorBoundary";
import { PreferencesProvider } from "~/hooks/usePreferences";
import { HotkeysProvider } from "./HotkeysProvider";
import { makeT } from "~/i18n";

type Props = { locale: Locale; children: ReactNode };

export function Layout({ locale, children }: Props) {
  const t = makeT(locale);
  return (
    <PreferencesProvider>
      <HotkeysProvider>
        <div className="app">
          <SkipLink label={t("skip_to_content")} />
          <Navbar locale={locale} />
          <main id="main-content" className="main" tabIndex={-1}>
            <div className="container">
              <ErrorBoundary>{children}</ErrorBoundary>
            </div>
          </main>
          <Footer locale={locale} />
        </div>
      </HotkeysProvider>
    </PreferencesProvider>
  );
}
