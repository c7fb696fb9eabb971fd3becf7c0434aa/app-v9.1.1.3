import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportClientEvent, type ClientRoute } from '../lib/observability';

interface Props {
  children: ReactNode;
  route: ClientRoute;
}

interface State {
  hasError: boolean;
}

export class RouteErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    reportClientEvent('route_render_failure', this.props.route);
    if (/loading chunk|failed to fetch dynamically imported module/i.test(error.message)) {
      reportClientEvent('route_chunk_failure', this.props.route);
    }
  }

  override render() {
    if (this.state.hasError) {
      return (
        <section className="status-panel" role="alert">
          <h1 className="home-title">This section could not be loaded</h1>
          <p className="status-message">
            Your public content and other routes remain available. Reload this section to try again.
          </p>
          <button className="action-button" type="button" onClick={() => window.location.reload()}>
            Try again
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}
