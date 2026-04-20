import { useEffect, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useHotkey, useHotkeySequence } from "@tanstack/react-hotkeys";
import { Autocomplete } from "./Autocomplete";
import { SettingsMenu } from "./Settings";

const IS_MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
const CMD_KEY_LABEL = IS_MAC ? "⌘" : "Ctrl";

function focusSearch() {
  const input = document.getElementById("global-search");
  if (input instanceof HTMLInputElement) {
    input.focus();
    input.select();
  }
}

export function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  useHotkeySequence(["G", "H"], () => {
    navigate({ to: "/" });
  });
  useHotkeySequence(["G", "S"], () => {
    navigate({ to: "/search" });
  });
  useHotkey("/", (e) => {
    e.preventDefault();
    focusSearch();
  });

  // Cmd+K (Mac) / Ctrl+K (Windows/Linux) — universal "open search" shortcut.
  // Done with a native listener so it overrides the browser's default
  // (Cmd+K focuses the Chrome omnibox in search-engine mode on Mac).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        focusSearch();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header className="navbar">
        <div className="container navbar__inner">
          <Link to="/" className="navbar__brand" aria-label="Pokédex home">
            Poké Dex
          </Link>
          <div className="navbar__search">
            <Autocomplete kbdHint={CMD_KEY_LABEL} />
          </div>
          <div className="navbar__spacer" aria-hidden="true" />
          <div className="navbar__controls">
            <SettingsMenu />
          </div>
        </div>
      </header>
      <main id="main-content" className="main" tabIndex={-1}>
        <div className="container">{children}</div>
      </main>
      <footer className="footer">
        <div className="container">
          <p>
            Data from{" "}
            <a href="https://pokeapi.co" target="_blank" rel="noreferrer noopener">
              PokéAPI
            </a>
            . Pokémon © Nintendo / Game Freak.
          </p>
          <p>
            Shortcuts: <kbd>{CMD_KEY_LABEL}</kbd>
            <kbd>K</kbd> search · <kbd>/</kbd> search · <kbd>g</kbd> <kbd>h</kbd> home ·{" "}
            <kbd>g</kbd> <kbd>s</kbd> browse · <kbd>Esc</kbd> closes popovers
          </p>
        </div>
      </footer>
    </div>
  );
}
