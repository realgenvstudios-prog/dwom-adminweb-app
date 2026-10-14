import React from 'react';
import { logger } from '../utils/logger';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

// Without this, a render-time crash anywhere in the app unmounts the whole
// tree and leaves a blank page with the real error visible only in the
// console — exactly what happened debugging the Accept Invite page.
class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('❌ [ErrorBoundary] Caught render error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-lg rounded-xl border bg-card p-8 text-card-foreground shadow-sm">
            <h1 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h1>
            <p className="mb-4 text-sm text-muted-foreground">
              This page hit an unexpected error. Reloading usually fixes a transient issue —
              if it keeps happening, the detail below is what's actually failing.
            </p>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap text-destructive">
              {this.state.error.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
