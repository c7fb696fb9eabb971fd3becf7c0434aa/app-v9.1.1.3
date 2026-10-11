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

const subPage = {
  schemaVersion: 1,
  id: '33333333-3333-4333-8333-333333333333',
  title: 'Installation',
  slug: 'installation',
  parentId: page.id,
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
      pages: [page, subPage],
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
    expect(screen.getByLabelText('Sequence order #')).toHaveValue(1);
  });

  it('preserves card edits when selecting a different destination page', async () => {
    renderStudio();
    expect(await screen.findByLabelText('Card title')).toHaveValue('Install the app');

    fireEvent.change(screen.getByLabelText('Card title'), {
      target: { value: 'Updated install instructions' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Select' }));

    const explorer = screen.getByRole('dialog', { name: 'Page & card hierarchy explorer' });
    fireEvent.click(within(explorer).getByRole('treeitem', { name: 'Select page Installation' }));

    expect(screen.queryByRole('dialog', { name: 'Page & card hierarchy explorer' })).toBeNull();
    expect(screen.getByLabelText('Card title')).toHaveValue('Updated install instructions');
    expect(screen.getByText('Installation (/installation)')).toBeInTheDocument();
  });

  it('provides category-specific media inputs and validates external reference URLs', async () => {
    const { container } = renderStudio();
    expect(await screen.findByLabelText('Card title')).toHaveValue('Install the app');

    expect(screen.getByLabelText('Upload MP3 / audio')).toHaveAttribute(
      'accept',
      'audio/mpeg,audio/ogg,audio/wav',
    );
    expect(screen.getByLabelText('Upload PDF document')).toHaveAttribute(
      'accept',
      'application/pdf',
    );
    expect(screen.getByLabelText('Upload MP4 / video')).toHaveAttribute(
      'accept',
      'video/mp4,video/webm',
    );
    expect(screen.getByLabelText('Upload image')).toHaveAttribute(
      'accept',
      'image/jpeg,image/png,image/webp',
    );

    fireEvent.change(screen.getByLabelText('Upload MP3 / audio'), {
      target: { files: [new File(['pdf'], 'guide.pdf', { type: 'application/pdf' })] },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('Choose a supported audio file.');

    fireEvent.change(screen.getByLabelText('Audio reference URL'), {
      target: { value: 'https://media.example.test/lesson.mp3' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add audio URL' }));
    await waitFor(() =>
      expect(container.querySelector('.studio-attachment-list')).toHaveTextContent(
        'Audio reference',
      ),
    );
    expect(container.querySelector('.studio-attachment-list')).toHaveTextContent('link');

    fireEvent.change(screen.getByLabelText('PDF reference URL'), {
      target: { value: 'javascript:alert(1)' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add PDF URL' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'External links must use http or https.',
    );
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
