import { useEffect, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useHotkey, useHotkeySequence } from "@tanstack/react-hotkeys";
import { Autocomplete } from "./Autocomplete";
import { BurgerMenu } from "./BurgerMenu";
import { Pokeball } from "./Pokeball";
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
  useHotkeySequence(["G", "P"], () => {
    navigate({ to: "/pokemon" });
  });
  useHotkeySequence(["G", "B"], () => {
    navigate({ to: "/berries" });
  });
  useHotkeySequence(["G", "I"], () => {
    navigate({ to: "/items" });
  });
  useHotkeySequence(["G", "L"], () => {
    navigate({ to: "/locations" });
  });
  useHotkeySequence(["G", "M"], () => {
    navigate({ to: "/moves" });
  });
  useHotkeySequence(["G", "G"], () => {
    navigate({ to: "/generations" });
  });
  useHotkey("/", (e) => {
    e.preventDefault();
    focusSearch();
  });

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
          <BurgerMenu />
          <Link to="/" className="navbar__brand" aria-label="Pokédex home">
            <Pokeball className="navbar__brand__icon" />
            <span>Poké Dex</span>
          </Link>
          <div className="navbar__search">
            <Autocomplete kbdHint={CMD_KEY_LABEL} />
          </div>
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
            <kbd>K</kbd> / <kbd>/</kbd> search · <kbd>g</kbd>+<kbd>h</kbd> home ·{" "}
            <kbd>g</kbd>+<kbd>p</kbd> Pokémon · <kbd>g</kbd>+<kbd>b</kbd> berries ·{" "}
            <kbd>g</kbd>+<kbd>i</kbd> items · <kbd>g</kbd>+<kbd>m</kbd> moves ·{" "}
            <kbd>g</kbd>+<kbd>l</kbd> locations · <kbd>g</kbd>+<kbd>g</kbd> generations ·{" "}
            <kbd>[</kbd>/<kbd>]</kbd> prev / next on detail · <kbd>Esc</kbd> close popover
          </p>
        </div>
      </footer>
    </div>
  );
}
