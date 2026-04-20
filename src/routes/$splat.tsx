import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/$splat")({
  component: NotFoundPage,
  head: () => ({ meta: [{ title: "Not found — Pokédex" }] }),
});

function NotFoundPage() {
  return (
    <div className="notfound">
      <h1>Page not found</h1>
      <p>We couldn't find the page you were looking for.</p>
      <Link to="/">Back to home</Link>
    </div>
  );
}
