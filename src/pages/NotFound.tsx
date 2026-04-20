import { Link, useRouterState } from "@tanstack/react-router";
import { ConsoleDevice } from "~/components/ConsoleDevice";

export function NotFoundPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <ConsoleDevice title="POKÉ DEX · ERR" subtitle="signal lost" ariaLabel="Page not found">
      <div className="error-state" role="alert">
        <h1>&gt; 404 · No entry</h1>
        <p>
          No route matched{" "}
          <code
            className="mono"
            style={{
              color: "var(--amber)",
              background: "rgba(0,0,0,0.3)",
              padding: "2px 6px",
              borderRadius: "3px",
            }}
          >
            {pathname}
          </code>
        </p>
        <p style={{ marginTop: "1.5rem" }}>
          <Link to="/" className="hero-cta">
            ◀ Return to home
          </Link>
        </p>
      </div>
    </ConsoleDevice>
  );
}
