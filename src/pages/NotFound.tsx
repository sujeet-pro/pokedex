import { Link, useRouterState } from "@tanstack/react-router";

export function NotFoundPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="error-state" role="alert">
      <h1>Page not found</h1>
      <p>
        No route matched <code>{pathname}</code>.
      </p>
      <Link to="/" className="hero__cta">
        Back to home
      </Link>
    </div>
  );
}
