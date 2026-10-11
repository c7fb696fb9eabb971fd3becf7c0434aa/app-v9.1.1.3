import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StudioWorkspace } from './StudioWorkspace';

const { readSnapshot, githubRequest } = vi.hoisted(() => ({
  readSnapshot: vi.fn(),
  githubRequest: vi.fn(),
}));

vi.mock('../auth', () => ({
  useAuth: () => ({
    githubRequest,
    user: { login: 'studio-user' },
  }),
}));

vi.mock('../github', () => ({
  createGitHubRepositoryClient: () => ({ readSnapshot }),
}));

const page = {
  schemaVersion: 1,
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Getting started',
  slug: 'getting-started',
  parentId: null,
  order: 0,
};

const card = {
  schemaVersion: 1,
  id: '22222222-2222-4222-8222-222222222222',
  pageId: page.id,
  order: 0,
  title: 'Install the app',
  definition: 'Follow the installation steps.',
  attachments: [],
};

function renderStudio() {
  return render(
    <MemoryRouter initialEntries={['/studio']}>
      <StudioWorkspace />
    </MemoryRouter>,
  );
}

describe('StudioWorkspace management surfaces', () => {
  beforeEach(() => {
    readSnapshot.mockResolvedValue({
      sourceCommit: 'a'.repeat(40),
      pages: [page],
      cards: [card],
      assetPaths: [],
      repository: { owner: 'docs-owner', name: 'docs-repo', branch: 'main' },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('opens the hierarchy explorer and edits a card with a live preview beside its fields', async () => {
    const { container } = renderStudio();

    expect(await screen.findByRole('heading', { name: 'GUI Management Portal' })).toBeVisible();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Hierarchy Explorer' })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Hierarchy Explorer' }));

    const explorer = screen.getByRole('dialog', { name: 'Page & card hierarchy explorer' });
    fireEvent.click(within(explorer).getByRole('button', { name: 'Edit card Install the app' }));

    expect(await screen.findByRole('heading', { name: 'Edit card' })).toBeVisible();
    expect(screen.getByRole('region', { name: 'Card draft preview' })).toBeVisible();
    expect(container.querySelector('.studio-columns.has-card-editor')).toBeInTheDocument();
    expect(screen.getByLabelText('Card title')).toHaveValue('Install the app');
  });

  it('tests access by reading the configured repository in the active session', async () => {
    renderStudio();
    await waitFor(() => expect(screen.getByRole('button', { name: 'GitHub Sync' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'GitHub Sync' }));

    const dialog = screen.getByRole('dialog', { name: 'GitHub repository sync' });
    expect(within(dialog).getByText('docs-owner')).toBeInTheDocument();
    expect(within(dialog).getByText('docs-repo')).toBeInTheDocument();
    expect(within(dialog).getByText('studio-user')).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Test connection' }));

    const result = await within(dialog).findByText(/Connected\. Repository content is readable/);
    expect(result).toHaveAttribute('role', 'status');
    expect(readSnapshot).toHaveBeenCalledTimes(2);
  });
});
