/**
 * ErrorBoundary Component
 * 
 * React error boundary component that catches JavaScript errors anywhere in the child
 * component tree and displays a fallback UI instead of crashing the whole application.
 */

import { Component, ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary class component that implements React error boundary pattern.
 * Catches errors during rendering, in lifecycle methods, and in constructors.
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch() {
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-state error-state--full">
          <TriangleAlert color="var(--color-error)" size={30} />
          <div>
            <h1 className="section-title">Something went wrong</h1>
            <p className="section-copy error-state__copy">Refresh the page. If the problem remains, return in a moment and try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="button button--primary error-state__action"
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
