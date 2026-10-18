import { useRef, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ActionToolbar } from './ActionToolbar';
import { CardPreview } from './CardPreview';
import { GitHubSyncDialog } from './GitHubSyncDialog';
import { WorkspaceActionButton, WorkspaceFrame, WorkspacePanel, AnchoredDialog } from './Workspace';

describe('reusable workspace components', () => {
  it('composes panel slots and forwards inert state and overlays', () => {
    render(
      <WorkspaceFrame
        ariaLabel="Editor workspace"
        panelsInert
        classNames={{ root: 'frame', panels: 'panels' }}
        overlay={<div role="dialog" aria-label="Explorer" />}
      >
        <WorkspacePanel
          ariaLabel="Navigation panel"
          header={<span>Header slot</span>}
          content={<span>Content slot</span>}
          footer={<span>Footer slot</span>}
          classNames={{
            root: 'panel',
            layout: 'layout',
            header: 'header',
            content: 'content',
            footer: 'footer',
          }}
        />
      </WorkspaceFrame>,
    );

    expect(screen.getByRole('region', { name: 'Editor workspace' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Navigation panel' })).toHaveClass('panel');
    expect(screen.getByLabelText('Navigation panel header')).toHaveTextContent('Header slot');
    expect(screen.getByLabelText('Navigation panel content')).toHaveTextContent('Content slot');
    expect(screen.getByLabelText('Navigation panel footer')).toHaveTextContent('Footer slot');
    expect(document.querySelector('.panels')).toHaveAttribute('inert');
    expect(screen.getByRole('dialog', { name: 'Explorer' })).toBeInTheDocument();
  });

  it('exposes reusable button identity, icon, attributes, and behavior through props', () => {
    const onClick = vi.fn();
    render(
      <WorkspaceActionButton
        label="Open preview"
        icon="cardPreview"
        className="preview-action"
        aria-expanded="false"
        onClick={onClick}
      />,
    );

    const button = screen.getByRole('button', { name: 'Open preview' });
    expect(button).toHaveClass('preview-action');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('traps modal focus, closes on Escape, and restores focus to the supplied trigger', () => {
    function Harness() {
      const triggerRef = useRef<HTMLButtonElement>(null);
      const [open, setOpen] = useState(true);
      return (
        <>
          <button ref={triggerRef} type="button">
            Open dialog
          </button>
          {open && (
            <AnchoredDialog
              className="dialog"
              ariaLabel="Custom dialog"
              modal
              onClose={() => setOpen(false)}
              returnFocusRef={triggerRef}
            >
              <button type="button">First control</button>
              <button type="button">Last control</button>
            </AnchoredDialog>
          )}
        </>
      );
    }

    render(<Harness />);
    const first = screen.getByRole('button', { name: 'First control' });
    const last = screen.getByRole('button', { name: 'Last control' });
    expect(first).toHaveFocus();
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(first).toHaveFocus();
    fireEvent.keyDown(first, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Custom dialog' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open dialog' })).toHaveFocus();
  });

  it('requires a successful connection test before saving the entered token', async () => {
    const onTest = vi.fn();
    const onSave = vi.fn();
    render(
      <GitHubSyncDialog
        id="sync-test"
        repository={{ owner: 'team', name: 'manuals', branch: 'docs' }}
        copy={{
          dialogLabel: 'Repository settings',
          title: 'Connect repository',
          closeLabel: 'Close settings',
          ownerLabel: 'Organization',
          repositoryLabel: 'Repository',
          branchLabel: 'Target branch',
          tokenLabel: 'Access key',
          tokenPlaceholder: 'Key value',
          resultsTitle: 'Status',
          resultsMessage: 'No attempt yet',
          testSuccessMessage: 'Connection passed.',
          testFailureMessage: 'Connection failed.',
          saveFailureMessage: 'Save failed.',
          testLabel: 'Check access',
          saveLabel: 'Save settings',
        }}
        onClose={() => undefined}
        onTest={onTest}
        onSave={onSave}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Repository settings' })).toBeInTheDocument();
    expect(screen.getByLabelText('Organization')).toHaveValue('team');
    expect(screen.getByLabelText('Repository')).toHaveValue('manuals');
    expect(screen.getByLabelText('Target branch')).toHaveValue('docs');
    fireEvent.change(screen.getByLabelText('Access key'), { target: { value: 'temporary' } });
    expect(screen.getByRole('button', { name: 'Save settings' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Check access' }));
    expect(await screen.findByText('Connection passed.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save settings' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }));
    expect(onTest).toHaveBeenCalledWith('temporary');
    expect(onSave).toHaveBeenCalledWith('temporary');
  });

  it('keeps saving disabled when a connection test fails or the token changes', async () => {
    const onTest = vi.fn().mockRejectedValue(new Error('github_token_invalid'));
    render(
      <GitHubSyncDialog
        id="sync-failure"
        repository={{ owner: 'team', name: 'manuals', branch: 'docs' }}
        copy={{
          dialogLabel: 'Repository settings',
          title: 'Connect repository',
          closeLabel: 'Close settings',
          ownerLabel: 'Organization',
          repositoryLabel: 'Repository',
          branchLabel: 'Target branch',
          tokenLabel: 'Access key',
          tokenPlaceholder: 'Key value',
          resultsTitle: 'Status',
          resultsMessage: 'No attempt yet',
          testSuccessMessage: 'Connection passed.',
          testFailureMessage: 'Connection failed.',
          saveFailureMessage: 'Save failed.',
          testLabel: 'Check access',
          saveLabel: 'Save settings',
        }}
        onClose={() => undefined}
        onTest={onTest}
        onSave={() => undefined}
      />,
    );

    fireEvent.change(screen.getByLabelText('Access key'), { target: { value: 'invalid' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check access' }));
    expect(
      await screen.findByText('GitHub rejected this token. Check it and try again.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save settings' })).toBeDisabled();

    onTest.mockResolvedValue(undefined);
    fireEvent.change(screen.getByLabelText('Access key'), { target: { value: 'valid' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check access' }));
    expect(await screen.findByText('Connection passed.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Access key'), { target: { value: 'changed' } });
    expect(screen.getByRole('button', { name: 'Save settings' })).toBeDisabled();
  });

  it('renders toolbar and card preview from supplied action and content data', () => {
    const onSelect = vi.fn();
    const action = { id: 'preview', icon: 'cardPreview' as const, label: 'Preview', onSelect };
    const { rerender } = render(
      <>
        <ActionToolbar actions={[action]} ariaLabel="Configured actions" />
        <CardPreview
          ariaLabel="Reusable card"
          contentLabel="Reusable content"
          title="Example"
          category="Reference"
          titleIcon="promptContinue"
          actions={[action]}
          toolbarLabel="Card operations"
          notesLabel="Card notes"
          notesPlaceholder="Add a note"
          classNames={{
            root: 'card',
            content: 'card-content',
            contentHeader: 'card-header',
            contentTitle: 'card-title',
            toolbar: 'card-toolbar',
            toolbarTrack: 'card-actions',
            toolbarItem: 'card-action',
            notes: 'card-notes',
          }}
        />
      </>,
    );

    expect(screen.getByRole('toolbar', { name: 'Configured actions' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Reusable card' })).toHaveClass('card');
    expect(screen.getByRole('region', { name: 'Reusable content' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Example' })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Preview' })[0]!);
    expect(onSelect).toHaveBeenCalledOnce();

    const notes = screen.getByRole('textbox', { name: 'Card notes' });
    fireEvent.change(notes, { target: { value: 'A reusable note' } });
    expect(notes).toHaveValue('A reusable note');

    rerender(
      <CardPreview
        ariaLabel="Changed card"
        contentLabel="Changed content"
        title="Updated"
        category="Guides"
        titleIcon="promptContinue"
        actions={[action]}
        toolbarLabel="Updated actions"
        notesLabel="Updated notes"
        notesPlaceholder="Write something"
      />,
    );
    expect(screen.getByRole('article', { name: 'Changed card' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Updated' })).toBeInTheDocument();
  });
});
