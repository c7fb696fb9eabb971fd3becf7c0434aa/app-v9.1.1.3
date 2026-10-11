import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { RouteErrorBoundary } from './RouteErrorBoundary';

function FailingRoute(): ReactNode {
  throw new Error('private route details must not be logged');
}

describe('route error boundary', () => {
  it('renders a local recovery state and reports no exception message or private data', () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const eventLog = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      render(
        <RouteErrorBoundary route="studio">
          <FailingRoute />
        </RouteErrorBoundary>,
      );
      expect(screen.getByRole('alert')).toHaveTextContent('This section could not be loaded');
      const reported = JSON.stringify(eventLog.mock.calls);
      expect(reported).toContain('route_render_failure');
      expect(reported).not.toContain('private route details');
    } finally {
      errorLog.mockRestore();
      eventLog.mockRestore();
    }
  });
});
