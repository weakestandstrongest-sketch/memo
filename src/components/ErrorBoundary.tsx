import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ja } from '../i18n/ja';

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
    console.error('Asterism crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="crash">
        <h1>{ja.crash.title}</h1>
        <p>{ja.crash.text}</p>
        <button type="button" className="button button-primary" onClick={() => window.location.reload()}>
          {ja.crash.reload}
        </button>
      </div>
    );
  }
}
