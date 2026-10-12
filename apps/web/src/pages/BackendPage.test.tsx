import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { BackendPage } from './BackendPage';

describe('BackendPage', () => {
  it('renders the independent header and centered card editor scaffold', () => {
    const { container } = render(
      <MemoryRouter>
        <BackendPage />
      </MemoryRouter>,
    );
    const header = container.querySelector('.backend-header');
    const buttons = screen.getAllByRole('button');
    const panels = screen.getAllByRole('region', { name: /^Workspace panel \d$/ });
    const leftPanel = screen.getByRole('region', { name: 'Workspace panel 1' });
    const rightPanel = screen.getByRole('region', { name: 'Workspace panel 2' });

    expect(header).toBeInTheDocument();
    expect(container.querySelector('.backend-shell')?.children).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Backend', level: 1 })).toBeInTheDocument();
    expect(panels).toHaveLength(2);
    expect(
      screen
        .getByRole('button', { name: 'Github Sync' })
        .querySelector('.backend-live-preview-dot'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'GitHub sync', exact: true }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select' })).toBeInTheDocument();
    expect(leftPanel.querySelector('.backend-workspace-panel-content')).toBeInTheDocument();
    expect(rightPanel.querySelector('.backend-workspace-panel-header')).toBeInTheDocument();
    expect(rightPanel.querySelector('.backend-workspace-panel-content')).toBeInTheDocument();
    expect(rightPanel.querySelector('.backend-workspace-panel-footer')).toBeInTheDocument();
    expect(buttons.slice(0, 6).map((button) => button.textContent)).toEqual([
      'Back to home',
      'Deployments',
      'Github Sync',
      'Select',
      'Live Preview',
      'Real-Time-Sync',
    ]);
    expect(screen.getByRole('article', { name: 'Card preview' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Card content' })).toBeInTheDocument();
    expect(container.querySelector('.backend-card-editor-toolbar')).toHaveAttribute(
      'aria-label',
      'Card actions',
    );
    expect(
      screen
        .getAllByRole('button')
        .slice(7)
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual([
      'Preview card',
      'Card files',
      'Video preview',
      'Card layout',
      'Terminal',
      'Card workflow',
      'Bookmark card',
      'Duplicate card',
      'Share card',
      'Card source',
      'Print card',
      'Card settings',
      'Export card',
      'Validate card',
      'Card document',
    ]);
    expect(screen.getByRole('textbox', { name: 'Card notes or commands' })).toHaveAttribute(
      'placeholder',
      'Type notes or commands on a straight line...',
    );
    expect(
      buttons.every((button) => button instanceof HTMLButtonElement && button.type === 'button'),
    ).toBe(true);
    expect(screen.getByRole('heading', { name: 'Backend', level: 1 })).toBeInTheDocument();
    expect(container.querySelector('.backend-main')).toBeInTheDocument();
    expect(container.querySelector('.site-header, .app-shell')).toBeNull();
  });
});
