import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useHotkey, useHotkeySequence } from "@tanstack/react-hotkeys";
import { Autocomplete } from "./Autocomplete";
import { SettingsMenu } from "./Settings";

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
    const input = document.getElementById("global-search");
    if (input instanceof HTMLInputElement) input.focus();
  });

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header className="navbar">
        <div className="container navbar__inner">
          <Link to="/" className="navbar__brand" aria-label="Pokédex home">
            Pokédex
          </Link>
          <div className="navbar__search">
            <Autocomplete />
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
          <p style={{ margin: 0 }}>
            Data from{" "}
            <a href="https://pokeapi.co" target="_blank" rel="noreferrer noopener">
              PokéAPI
            </a>
            . Pokémon © Nintendo / Game Freak.
          </p>
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.8em" }}>
            Keyboard shortcuts: <kbd>/</kbd> focus search · <kbd>g</kbd> <kbd>h</kbd> home ·{" "}
            <kbd>g</kbd> <kbd>s</kbd> search
          </p>
        </div>
      </footer>
    </div>
  );
}
