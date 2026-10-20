import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import type { RepositorySnapshotResponse } from '../lib/content';
import { HomePage } from './HomePage';

const { githubRequest, readSnapshot } = vi.hoisted(() => ({
  githubRequest: vi.fn(),
  readSnapshot: vi.fn(),
}));

vi.mock('../features/auth', () => ({
  useAuth: () => ({ githubRequest }),
}));

vi.mock('../features/github', () => ({
  createGitHubRepositoryClient: () => ({ readSnapshot }),
}));

const rootPageId = '11111111-1111-4111-8111-111111111111';
const childPageId = '22222222-2222-4222-8222-222222222222';
const containerId = '33333333-3333-4333-8333-333333333333';
const cardId = '44444444-4444-4444-8444-444444444444';

function createSnapshot(): RepositorySnapshotResponse {
  return {
    schemaVersion: 2,
    sourceCommit: 'a'.repeat(40),
    repository: { owner: 'docs-owner', name: 'docs-repo', branch: 'main' },
    pages: [
      {
        schemaVersion: 2,
        id: rootPageId,
        title: 'vscode',
        slug: 'vscode',
        parentId: null,
        order: 0,
      },
      {
        schemaVersion: 2,
        id: childPageId,
        title: 'environment',
        slug: 'environment',
        parentId: rootPageId,
        order: 0,
        description: 'Environment documentation.',
      },
    ],
    containers: [
      {
        schemaVersion: 2,
        id: containerId,
        pageId: childPageId,
        title: 'code',
        order: 0,
      },
    ],
    cards: [
      {
        schemaVersion: 2,
        id: cardId,
        containerId,
        order: 0,
        title: 'review',
        tag: 'workflow',
        definition: 'Review checklist content.',
        keyRule: 'Keep the changes focused.',
        code: 'git diff --check',
        spec: 'Review the complete change.',
        attachments: [],
      },
      {
        schemaVersion: 2,
        id: '55555555-5555-4555-8555-555555555555',
        containerId,
        order: 1,
        title: 'Publish changes',
        definition: 'Publish the reviewed changes.',
        attachments: [],
      },
    ],
  };
}

function CurrentPath() {
  const location = useLocation();
  return <output aria-label="Current path">{location.pathname}</output>;
}

function renderHome(path = '/home') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CurrentPath />
      <HomePage />
    </MemoryRouter>,
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    readSnapshot.mockResolvedValue(createSnapshot());
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('lists root pages and navigates nested pages at their own URLs', async () => {
    renderHome();

    expect(await screen.findByRole('navigation', { name: 'Current location' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Home' })).not.toBeInTheDocument();
    const rootLink = await screen.findByRole('link', { name: /vscode/ });
    expect(rootLink).toHaveAttribute('href', '/home/vscode');

    fireEvent.click(rootLink);
    expect(await screen.findByRole('navigation', { name: 'Current location' })).toHaveTextContent(
      'vscode',
    );
    expect(screen.queryByRole('heading', { name: 'vscode' })).not.toBeInTheDocument();
    const childPageLink = screen.getByRole('link', { name: /environment/ });
    expect(childPageLink).toHaveAttribute('href', '/home/vscode/environment');
    expect(screen.queryByText('Review checklist content.')).not.toBeInTheDocument();
    fireEvent.click(childPageLink);
    expect(await screen.findByLabelText('Current path')).toHaveTextContent(
      '/home/vscode/environment',
    );
    expect(screen.getByRole('heading', { name: 'review' })).toBeVisible();
  });

  it('shows a page and its cards at the page URL without child links or card routes', async () => {
    renderHome('/home/vscode/environment');

    expect(await screen.findByRole('navigation', { name: 'Current location' })).toHaveTextContent(
      'environment',
    );
    expect(screen.getByLabelText('Current path')).toHaveTextContent('/home/vscode/environment');
    expect(screen.queryByRole('link', { name: /review/ })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'review' })).toBeVisible();
    expect(screen.getByText('Review checklist content.')).toBeInTheDocument();
    expect(screen.getByText('Publish the reviewed changes.')).toBeInTheDocument();
    expect(screen.queryByText('Environment documentation.')).not.toBeInTheDocument();
  });

  it('uses an independent public card layout without editor controls or state', async () => {
    const { container } = renderHome('/home/vscode/environment');

    expect(await screen.findByText('Review checklist content.')).toBeInTheDocument();
    expect(screen.getByText('Publish the reviewed changes.')).toBeInTheDocument();
    expect(container.querySelectorAll('.public-card')).toHaveLength(2);
    expect(container.querySelector('.backend-card-editor-content')).toBeNull();
    expect(container.querySelector('.published-card-preview')).toBeNull();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(container.querySelector('.public-card-toolbar')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('heading', { name: 'code' })).not.toBeInTheDocument();
    expect(container.querySelector('.public-card-category')).toBeNull();
    expect(container.querySelector('.public-page-summary')).toBeNull();
    expect(container.querySelector('.public-page-description')).toBeNull();
    expect(container.querySelector('.public-container-title')).toBeNull();
    expect(container.querySelector('.public-card-heading')).toBeInTheDocument();
  });

  it('does not include cards from nested pages in a parent page', async () => {
    renderHome('/home/vscode');

    expect(await screen.findByRole('navigation', { name: 'Current location' })).toHaveTextContent(
      'vscode',
    );
    expect(screen.queryByRole('heading', { name: 'vscode' })).not.toBeInTheDocument();
    expect(screen.queryByText('Review checklist content.')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /environment/ })).toHaveAttribute(
      'href',
      '/home/vscode/environment',
    );
  });

  it('does not show a subpage list on a page without nested pages', async () => {
    renderHome('/home/vscode/environment');

    expect(await screen.findByRole('heading', { name: 'review' })).toBeVisible();
    expect(screen.queryByRole('navigation', { name: /Pages under/ })).not.toBeInTheDocument();
  });

  it('renders attachments using public repository and external URLs', async () => {
    const snapshot = createSnapshot();
    snapshot.cards[0]?.attachments.push(
      {
        id: '77777777-7777-4777-8777-777777777777',
        kind: 'pdf',
        label: 'Review guide',
        assetId: '88888888-8888-4888-8888-888888888888',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
      },
      {
        id: '99999999-9999-4999-8999-999999999999',
        kind: 'link',
        label: 'External checklist',
        url: 'https://docs.example.test/checklist',
      },
    );
    readSnapshot.mockResolvedValueOnce(snapshot);

    renderHome('/home/vscode/environment');

    expect(await screen.findByRole('link', { name: 'Review guide' })).toHaveAttribute(
      'href',
      'https://raw.githubusercontent.com/docs-owner/docs-repo/main/content/media/88888888-8888-4888-8888-888888888888.pdf',
    );
    expect(screen.getByRole('link', { name: 'External checklist' })).toHaveAttribute(
      'href',
      'https://docs.example.test/checklist',
    );
  });

  it('shows a retry action when repository loading fails', async () => {
    readSnapshot.mockRejectedValueOnce(new Error('github_rate_limited'));
    renderHome();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'GitHub is rate-limiting requests. Try again shortly.',
    );
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('normalizes trailing slashes on public page routes', async () => {
    renderHome('/home/vscode/environment/');
    expect(await screen.findByRole('navigation', { name: 'Current location' })).toHaveTextContent(
      'environment',
    );
    expect(screen.queryByRole('heading', { name: 'environment' })).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Page not found' })).toBeNull(),
    );
  });

  it('shows an explicit not-found state for unknown page paths', async () => {
    renderHome('/home/vscode/environment/missing-card');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeVisible();
  });

  it('does not treat a card title as a public route', async () => {
    renderHome('/home/vscode/environment/review');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeVisible();
    expect(screen.queryByText('Review checklist content.')).not.toBeInTheDocument();
  });
});
