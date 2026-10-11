import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GITHUB_REPOSITORY } from '../../../config';
import { StudioDeployments } from './StudioDeployments';

const { githubRequest } = vi.hoisted(() => ({
  githubRequest: vi.fn(),
}));

vi.mock('../auth', () => ({
  useAuth: () => ({ githubRequest }),
}));

describe('StudioDeployments', () => {
  beforeEach(() => {
    githubRequest.mockResolvedValue(
      new Response(
        JSON.stringify({
          workflow_runs: [
            {
              id: 42,
              name: 'Deploy to GitHub Pages',
              status: 'completed',
              conclusion: 'success',
              created_at: '2026-06-01T12:00:00Z',
              head_sha: 'a'.repeat(40),
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows actual workflow run details from the configured repository', async () => {
    render(
      <MemoryRouter>
        <StudioDeployments />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('link', { name: 'Deploy to GitHub Pages' })).toHaveAttribute(
      'href',
      `https://github.com/${GITHUB_REPOSITORY.owner}/${GITHUB_REPOSITORY.name}/actions/runs/42`,
    );
    expect(screen.getByText('success')).toBeInTheDocument();
    expect(githubRequest).toHaveBeenCalledWith(
      `/repos/${GITHUB_REPOSITORY.owner}/${GITHUB_REPOSITORY.name}/actions/runs?per_page=10`,
    );
  });
});
