import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error): void {
    console.error("ErrorBoundary:", error);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? <div className="notfound"><h1>Something went wrong.</h1></div>;
    }
    return this.props.children;
  }
}
