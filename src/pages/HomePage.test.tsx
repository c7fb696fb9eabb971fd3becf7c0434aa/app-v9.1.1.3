import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('HomePage', () => {
  beforeEach(() => {
    readSnapshot.mockResolvedValue({
      sourceCommit: 'a'.repeat(40),
      pages: [],
      cards: [],
      repository: { owner: 'docs-owner', name: 'docs-repo', branch: 'main' },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('keeps an empty documentation home free of account, repository, and empty-state panels', async () => {
    const { container } = render(<HomePage />);

    expect(await screen.findByRole('heading', { name: 'Home' })).toBeVisible();
    await waitFor(() =>
      expect(screen.queryByText(/Loading pages and cards/)).not.toBeInTheDocument(),
    );

    expect(screen.queryByRole('heading', { name: /welcome/i })).not.toBeInTheDocument();
    expect(screen.queryByText('docs-owner/docs-repo')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Refresh' })).not.toBeInTheDocument();
    expect(
      screen.queryByText('No documentation pages have been published yet.'),
    ).not.toBeInTheDocument();
    expect(container.querySelector('.published-page-tree')?.childElementCount).toBe(0);
  });

  it('loads the repository without showing temporary loading copy', () => {
    readSnapshot.mockReturnValue(new Promise(() => {}));
    render(<HomePage />);

    expect(readSnapshot).toHaveBeenCalledOnce();
    expect(screen.queryByText(/Loading pages and cards from GitHub/)).not.toBeInTheDocument();
  });

  it('publishes each page card set as its own resolver-backed carousel', async () => {
    readSnapshot.mockResolvedValueOnce({
      sourceCommit: 'a'.repeat(40),
      repository: { owner: 'docs-owner', name: 'docs-repo', branch: 'main' },
      pages: [
        {
          schemaVersion: 1,
          id: '11111111-1111-4111-8111-111111111111',
          title: 'Platform',
          slug: 'platform',
          parentId: null,
          order: 0,
        },
        {
          schemaVersion: 1,
          id: '22222222-2222-4222-8222-222222222222',
          title: 'Empty child',
          slug: 'empty-child',
          parentId: '11111111-1111-4111-8111-111111111111',
          order: 0,
        },
        {
          schemaVersion: 1,
          id: '33333333-3333-4333-8333-333333333333',
          title: 'Single card',
          slug: 'single-card',
          parentId: null,
          order: 1,
        },
      ],
      cards: [
        {
          schemaVersion: 1,
          id: '44444444-4444-4444-8444-444444444444',
          pageId: '11111111-1111-4111-8111-111111111111',
          order: 0,
          title: 'First platform card',
          definition: 'First content.',
          attachments: [],
        },
        {
          schemaVersion: 1,
          id: '55555555-5555-4555-8555-555555555555',
          pageId: '11111111-1111-4111-8111-111111111111',
          order: 1,
          title: 'Second platform card',
          definition: 'Second content.',
          attachments: [],
        },
        {
          schemaVersion: 1,
          id: '66666666-6666-4666-8666-666666666666',
          pageId: '33333333-3333-4333-8333-333333333333',
          order: 0,
          title: 'Only card',
          definition: 'Single-card content.',
          attachments: [],
        },
      ],
    });

    render(<HomePage />);
    expect(await screen.findByText('First content.')).toBeInTheDocument();
    expect(screen.queryByText('Second content.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next card in Platform' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Next card in Empty child' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Next card in Single card' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('No cards in this container.')).toBeInTheDocument();
    expect(screen.getByText('Single-card content.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next card in Platform' }));
    expect(await screen.findByText('Second content.')).toBeInTheDocument();
    expect(screen.queryByText('First content.')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Show card 2 in Platform: Second platform card',
      }),
    ).toHaveClass('published-card-carousel-indicator', 'is-active');
    fireEvent.click(
      screen.getByRole('button', { name: 'Show card 1 in Platform: First platform card' }),
    );
    expect(await screen.findByText('First content.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Previous card in Platform' }));
    expect(await screen.findByText('Second content.')).toBeInTheDocument();
  });

  it('publishes every schema-v2 container with independent carousel selection', async () => {
    readSnapshot.mockResolvedValueOnce({
      schemaVersion: 2,
      sourceCommit: 'a'.repeat(40),
      repository: { owner: 'docs-owner', name: 'docs-repo', branch: 'main' },
      pages: [
        {
          schemaVersion: 2,
          id: '11111111-1111-4111-8111-111111111111',
          title: 'Platform',
          slug: 'platform',
          parentId: null,
          order: 0,
        },
      ],
      containers: [
        {
          schemaVersion: 2,
          id: '22222222-2222-4222-8222-222222222222',
          pageId: '11111111-1111-4111-8111-111111111111',
          title: 'Guides',
          order: 0,
        },
        {
          schemaVersion: 2,
          id: '33333333-3333-4333-8333-333333333333',
          pageId: '11111111-1111-4111-8111-111111111111',
          title: 'References',
          order: 1,
        },
      ],
      cards: [
        {
          schemaVersion: 2,
          id: '44444444-4444-4444-8444-444444444444',
          containerId: '22222222-2222-4222-8222-222222222222',
          order: 0,
          title: 'First guide',
          definition: 'First guide content.',
          attachments: [],
        },
        {
          schemaVersion: 2,
          id: '55555555-5555-4555-8555-555555555555',
          containerId: '22222222-2222-4222-8222-222222222222',
          order: 1,
          title: 'Second guide',
          definition: 'Second guide content.',
          attachments: [],
        },
      ],
    });

    render(<HomePage />);
    expect(await screen.findByText('First guide content.')).toBeInTheDocument();
    expect(screen.getByText('No cards in this container.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next card in Guides' }));
    expect(await screen.findByText('Second guide content.')).toBeInTheDocument();
    expect(screen.queryByText('First guide content.')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Next card in References' }),
    ).not.toBeInTheDocument();
  });
});
