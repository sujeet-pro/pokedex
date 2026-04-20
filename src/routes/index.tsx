import { createFileRoute, Link } from "@tanstack/react-router";
import { Pokeball } from "~/components/Pokeball";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({ meta: [{ title: "Pokédex — Choose language" }] }),
});

function LandingPage() {
  return (
    <div className="landing">
      <Pokeball />
      <h1>Pokédex</h1>
      <p>Select a language to continue.</p>
      <div className="landing-picker">
        <Link to="/$lang" params={{ lang: "en" }}>
          English
        </Link>
        <Link to="/$lang" params={{ lang: "fr" }}>
          Français
        </Link>
      </div>
    </div>
  );
}
