import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  name: string;
  children: ReactNode;
};

type State = {
  error: Error | null;
};

/** Keeps one screen/tab crash from unmounting the whole Tool Hub shell. */
export class ScreenErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[Tool Hub] ${this.props.name} crashed`, error, info.componentStack);
  }

  private retry = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <p className="text-sm font-semibold text-rose-200">{this.props.name} failed to load</p>
        <p className="mt-2 text-xs text-[var(--muted)]">{this.state.error.message}</p>
        <button
          type="button"
          className="btn btn-ghost mt-4"
          onClick={() => {
            this.retry();
            window.location.reload();
          }}
        >
          Reload page
        </button>
      </div>
    );
  }
}
