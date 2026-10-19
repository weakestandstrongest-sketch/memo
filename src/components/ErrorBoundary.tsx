import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

/** Last line of defence: shows a friendly message instead of a blank page if something crashes. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('My Universe crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="crash">
        <h1>Something went wrong.</h1>
        <p>Your stars are still saved in this browser. Reloading the page usually fixes this.</p>
        <button type="button" className="button button-primary" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    );
  }
}
