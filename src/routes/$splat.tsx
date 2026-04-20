import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/$splat")({
  component: NotFoundPage,
  head: () => ({ meta: [{ title: "Not found — Pokédex" }] }),
});

function NotFoundPage() {
  return (
    <div className="app">
      <main className="main">
        <div className="container">
          <div className="error-state">
            <h1>Page not found</h1>
            <p>We couldn't find the page you were looking for.</p>
            <div className="nav-buttons">
              <Link to="/" className="hero-cta">Back to home</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
