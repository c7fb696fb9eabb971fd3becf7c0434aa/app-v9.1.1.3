import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button, Dialog, EmptyState, StatusBanner, Tabs, TextInput, TreeRow } from './Primitives';

describe('accessible UI primitives', () => {
  it('renders labelled input errors, status messages, and empty content semantically', () => {
    render(
      <>
        <TextInput
          id="title"
          label="Page title"
          value=""
          onChange={() => undefined}
          error="Required"
        />
        <StatusBanner variant="error">The page could not be loaded.</StatusBanner>
        <EmptyState title="No pages">Create a page to get started.</EmptyState>
      </>,
    );

    expect(screen.getByRole('textbox', { name: 'Page title' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByText('The page could not be loaded.')).toHaveAttribute('role', 'alert');
    expect(screen.getByRole('region', { name: 'No pages' })).toBeInTheDocument();
  });

  it('supports tab keyboard navigation and tree-row selection callbacks', () => {
    const onChange = vi.fn();
    const onSelect = vi.fn();
    render(
      <>
        <Tabs
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'media', label: 'Media' },
          ]}
          value="overview"
          onChange={onChange}
        />
        <TreeRow label="Guide" level={2} onSelect={onSelect} />
      </>,
    );
    const overview = screen.getByRole('tab', { name: 'Overview' });
    overview.focus();
    fireEvent.keyDown(overview, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('media');
    expect(screen.getByRole('tab', { name: 'Media' })).toHaveFocus();

    const treeItem = screen.getByRole('treeitem', { name: 'Guide' });
    expect(treeItem).toHaveAttribute('aria-level', '2');
    fireEvent.click(treeItem);
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('keeps buttons natively disabled and restores focus after a dialog closes', () => {
    const onClose = vi.fn();
    render(<Button disabled>Publish</Button>);
    expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled();

    const opener = document.createElement('button');
    opener.textContent = 'Open dialog';
    document.body.append(opener);
    opener.focus();
    const dialog = render(
      <Dialog title="Confirm publish" onClose={onClose}>
        <p>Review changes first.</p>
      </Dialog>,
    );
    expect(screen.getByRole('dialog', { name: 'Confirm publish' })).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
    dialog.unmount();
    expect(opener).toHaveFocus();
    opener.remove();
  });
});
