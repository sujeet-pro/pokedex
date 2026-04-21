import { useState, type ReactNode } from "react";
import type { Locale } from "~/types/locales";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { SkipLink } from "./SkipLink";
import { ErrorBoundary } from "./ErrorBoundary";
import { SearchDialog } from "./SearchDialog";
import { PreferencesProvider } from "~/hooks/usePreferences";
import { useSearchDialog } from "~/hooks/useSearchDialog";
import { CurrentEntityProvider, type CurrentEntity } from "~/hooks/useCurrentEntity";
import { SpeakerProvider } from "~/hooks/useSpeaker";
import { HotkeysProvider } from "./HotkeysProvider";
import { makeT } from "~/i18n";

type Props = { locale: Locale; children: ReactNode };

function LayoutShell({ locale, children }: Props) {
  const t = makeT(locale);
  const { open, setOpen } = useSearchDialog();
  return (
    <>
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
      <SearchDialog open={open} onOpenChange={setOpen} locale={locale} />
    </>
  );
}

export function Layout({ locale, children }: Props) {
  const [entity, setEntity] = useState<CurrentEntity | null>(null);
  return (
    <PreferencesProvider>
      <CurrentEntityProvider entity={entity} setEntity={setEntity}>
        <SpeakerProvider>
          <HotkeysProvider>
            <LayoutShell locale={locale}>{children}</LayoutShell>
          </HotkeysProvider>
        </SpeakerProvider>
      </CurrentEntityProvider>
    </PreferencesProvider>
  );
}
