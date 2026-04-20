import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({ meta: [{ title: "Pokédex — Choose language" }] }),
});

function LandingPage() {
  return (
    <div className="app">
      <main className="main" id="main-content">
        <div className="container">
          <div className="landing-hero">
            <h1>Pokédex</h1>
            <p>Select a language to continue · Choisissez votre langue</p>
            <div className="landing-hero__picker">
              <Link to="/$lang" params={{ lang: "en" }}>English</Link>
              <Link to="/$lang" params={{ lang: "fr" }}>Français</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
