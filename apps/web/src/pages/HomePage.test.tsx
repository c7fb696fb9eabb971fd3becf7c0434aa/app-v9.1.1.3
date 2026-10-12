import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomePage } from './HomePage';

const { readSnapshot } = vi.hoisted(() => ({
  readSnapshot: vi.fn(),
}));

vi.mock('../features/auth', () => ({
  useAuth: () => ({ githubRequest: vi.fn() }),
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
      assetPaths: [],
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
});
