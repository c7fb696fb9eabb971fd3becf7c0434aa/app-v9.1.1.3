import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BackendPage } from './BackendPage';

const { authState, githubRequest, loginWithPat, verifyGitHubPat, readSnapshot, publishV2Snapshot } =
  vi.hoisted(() => ({
    authState: {
      user: null as null | { id: string; login: string; name: null; avatarUrl: string },
    },
    githubRequest: vi.fn(),
    loginWithPat: vi.fn(),
    verifyGitHubPat: vi.fn(),
    readSnapshot: vi.fn(),
    publishV2Snapshot: vi.fn(),
  }));

vi.mock('../features/auth', () => ({
  useAuth: () => ({ githubRequest, loginWithPat, verifyGitHubPat, user: authState.user }),
}));

vi.mock('../features/github', () => ({
  createGitHubRepositoryClient: () => ({ readSnapshot, publishV2Snapshot }),
}));

const repositorySnapshot = {
  sourceCommit: 'a'.repeat(40),
  repository: { owner: 'docs-owner', name: 'docs-repo', branch: 'main' },
  pages: [
    {
      schemaVersion: 1 as const,
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Machine Learning',
      slug: 'machine-learning',
      parentId: null,
      order: 0,
      description: 'Machine learning documentation.',
    },
    {
      schemaVersion: 1 as const,
      id: '22222222-2222-4222-8222-222222222222',
      title: 'Neural Networks',
      slug: 'neural-networks',
      parentId: '11111111-1111-4111-8111-111111111111',
      order: 0,
      description: 'Neural network notes.',
    },
    {
      schemaVersion: 1 as const,
      id: '33333333-3333-4333-8333-333333333333',
      title: 'Platform Guide',
      slug: 'platform-guide',
      parentId: null,
      order: 1,
    },
  ],
  cards: [
    {
      schemaVersion: 1 as const,
      id: '44444444-4444-4444-8444-444444444444',
      pageId: '11111111-1111-4111-8111-111111111111',
      order: 0,
      title: 'Tensor Flow',
      tag: 'Foundations',
      definition: 'Tensors and neural-network workflows.',
      attachments: [],
    },
    {
      schemaVersion: 1 as const,
      id: '55555555-5555-4555-8555-555555555555',
      pageId: '11111111-1111-4111-8111-111111111111',
      order: 1,
      title: 'Training Fundamentals',
      tag: 'Training',
      definition: 'Repeatable model training and evaluation.',
      attachments: [],
    },
    {
      schemaVersion: 1 as const,
      id: '66666666-6666-4666-8666-666666666666',
      pageId: '33333333-3333-4333-8333-333333333333',
      order: 0,
      title: 'GitHub Actions',
      definition: 'Build and deployment automation.',
      attachments: [],
    },
  ],
};

beforeEach(() => {
  authState.user = null;
  loginWithPat.mockReset().mockImplementation(async () => {
    authState.user = {
      id: '123',
      login: 'verified-user',
      name: null,
      avatarUrl: 'https://avatars.example.test/123',
    };
  });
  verifyGitHubPat.mockReset().mockResolvedValue(undefined);
  readSnapshot.mockReset().mockResolvedValue(repositorySnapshot);
  publishV2Snapshot.mockReset();
});

describe('BackendPage', () => {
  it('reports the repository loading state and prevents opening an empty editor tree', () => {
    readSnapshot.mockReturnValue(new Promise(() => {}));
    render(
      <MemoryRouter>
        <BackendPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Loading repository content');
    expect(screen.getByRole('button', { name: 'Select' })).toBeDisabled();
  });

  it('renders repository-backed records in the editor and live preview', async () => {
    const { container } = render(
      <MemoryRouter>
        <BackendPage />
      </MemoryRouter>,
    );
    await screen.findByRole('form', { name: 'Selected record editor' });
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
    expect(screen.queryByRole('button', { name: /^GitHub sync$/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select' })).toBeInTheDocument();
    expect(leftPanel.querySelector('.backend-workspace-panel-content')).toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Selected record editor' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Edit name' })).toHaveValue('Tensor Flow');
    expect(rightPanel.querySelector('.backend-workspace-panel-header')).toBeInTheDocument();
    expect(rightPanel.querySelector('.backend-workspace-panel-content')).toBeInTheDocument();
    expect(rightPanel.querySelector('.backend-workspace-panel-footer')).toBeInTheDocument();
    expect(buttons.slice(0, 4).map((button) => button.textContent)).toEqual([
      'Back to home',
      'Deployments',
      'Github Sync',
      'Select',
    ]);
    expect(buttons.map((button) => button.textContent)).toContain('Save changes');
    expect(screen.getByRole('article', { name: 'Card preview' })).toHaveTextContent('Tensor Flow');
    expect(screen.getByRole('region', { name: 'Card content' })).toBeInTheDocument();
    expect(container.querySelector('.backend-card-editor-toolbar')).toHaveAttribute(
      'aria-label',
      'Card actions',
    );
    expect(
      Array.from(container.querySelectorAll('.backend-card-editor-toolbar button'), (button) =>
        button.getAttribute('aria-label'),
      ),
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

  it('publishes a changed v2 draft and reloads the committed snapshot', async () => {
    const v2Snapshot = {
      schemaVersion: 2 as const,
      sourceCommit: 'a'.repeat(40),
      repository: { owner: 'docs-owner', name: 'docs-repo', branch: 'main' },
      pages: [
        {
          schemaVersion: 2 as const,
          id: '11111111-1111-4111-8111-111111111111',
          title: 'Platform',
          slug: 'platform',
          parentId: null,
          order: 0,
        },
      ],
      containers: [
        {
          schemaVersion: 2 as const,
          id: '22222222-2222-4222-8222-222222222222',
          pageId: '11111111-1111-4111-8111-111111111111',
          title: 'Guides',
          order: 0,
        },
      ],
      cards: [
        {
          schemaVersion: 2 as const,
          id: '33333333-3333-4333-8333-333333333333',
          containerId: '22222222-2222-4222-8222-222222222222',
          order: 0,
          title: 'Install',
          definition: 'Install the application.',
          attachments: [],
        },
      ],
    };
    readSnapshot.mockResolvedValue(v2Snapshot);
    publishV2Snapshot.mockResolvedValue({ commitSha: 'b'.repeat(40) });
    render(
      <MemoryRouter>
        <BackendPage />
      </MemoryRouter>,
    );

    const name = await screen.findByRole('textbox', { name: 'Edit name' });
    fireEvent.change(name, { target: { value: 'Install revised' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText(/Saved as commit bbbbbbb/)).toBeInTheDocument();
    expect(publishV2Snapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        schemaVersion: 2,
        cards: [
          expect.objectContaining({
            title: 'Install revised',
            definition: 'Install the application.',
          }),
        ],
      }),
      'a'.repeat(40),
    );
    await screen.findByRole('form', { name: 'Selected record editor' });
    await waitFor(() => expect(readSnapshot).toHaveBeenCalledTimes(2));
  });

  it('preserves the v2 draft and reports an outdated-repository conflict', async () => {
    readSnapshot.mockResolvedValue({
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
      ],
      cards: [
        {
          schemaVersion: 2,
          id: '33333333-3333-4333-8333-333333333333',
          containerId: '22222222-2222-4222-8222-222222222222',
          order: 0,
          title: 'Install',
          definition: 'Install the application.',
          attachments: [],
        },
      ],
    });
    publishV2Snapshot.mockRejectedValue(new Error('repository_head_changed'));
    render(
      <MemoryRouter>
        <BackendPage />
      </MemoryRouter>,
    );

    const name = await screen.findByRole('textbox', { name: 'Edit name' });
    fireEvent.change(name, { target: { value: 'Keep this draft' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The repository changed since it was loaded.',
    );
    expect(screen.getByRole('textbox', { name: 'Edit name' })).toHaveValue('Keep this draft');
    expect(publishV2Snapshot).toHaveBeenCalledOnce();
  });

  it('keeps schema-v1 drafts local until migration is approved', async () => {
    render(
      <MemoryRouter>
        <BackendPage />
      </MemoryRouter>,
    );

    fireEvent.change(await screen.findByRole('textbox', { name: 'Edit name' }), {
      target: { value: 'Local only' },
    });

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    expect(screen.getByText(/reviewed schema-v2 migration/)).toBeInTheDocument();
    expect(publishV2Snapshot).not.toHaveBeenCalled();
  });

  it('keeps card drafts per record while carousel selection follows the active card', async () => {
    render(
      <MemoryRouter>
        <BackendPage />
      </MemoryRouter>,
    );
    await screen.findByRole('textbox', { name: 'Edit name' });

    const name = screen.getByRole('textbox', { name: 'Edit name' });
    expect(screen.getByRole('textbox', { name: 'Edit tag' })).toHaveValue('Foundations');
    fireEvent.change(name, { target: { value: 'Tensor Flow Revised' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Edit tag' }), {
      target: { value: 'Revised foundations' },
    });
    expect(screen.getByRole('article', { name: 'Card preview' })).toHaveTextContent(
      'Tensor Flow Revised',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Next card' }));
    expect(screen.getByRole('textbox', { name: 'Edit name' })).toHaveValue('Training Fundamentals');
    expect(screen.getByRole('textbox', { name: 'Edit tag' })).toHaveValue('Training');
    expect(screen.getByRole('button', { name: 'Show card 2: Training Fundamentals' })).toHaveClass(
      'backend-card-carousel-indicator',
      'is-active',
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Edit content' }), {
      target: { value: 'Draft for the second card.' },
    });
    expect(screen.getByRole('article', { name: 'Card preview' })).toHaveTextContent(
      'Draft for the second card.',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Previous card' }));
    expect(screen.getByRole('textbox', { name: 'Edit name' })).toHaveValue('Tensor Flow Revised');
    expect(screen.getByRole('textbox', { name: 'Edit tag' })).toHaveValue('Revised foundations');
    fireEvent.click(screen.getByRole('button', { name: 'Next card' }));
    expect(screen.getByRole('textbox', { name: 'Edit content' })).toHaveValue(
      'Draft for the second card.',
    );
  });

  it('shows empty containers without carousel controls and single-card containers without dots', async () => {
    render(
      <MemoryRouter>
        <BackendPage />
      </MemoryRouter>,
    );
    await screen.findByRole('textbox', { name: 'Edit name' });
    fireEvent.click(screen.getByRole('button', { name: 'Select' }));

    fireEvent.click(screen.getByRole('button', { name: 'Expand Machine Learning' }));
    const neuralNetworks = screen.getByRole('button', { name: /Neural Networks Subpage/ });
    fireEvent.click(neuralNetworks);
    fireEvent.click(screen.getByRole('button', { name: 'Expand Neural Networks' }));
    fireEvent.click(
      within(neuralNetworks.closest('li')!).getByRole('button', {
        name: /Cards Card Container/,
      }),
    );
    expect(screen.getByRole('article', { name: 'Card preview' })).toHaveTextContent(
      'This container has no cards',
    );
    expect(screen.queryByRole('button', { name: 'Next card' })).not.toBeInTheDocument();

    const platform = screen.getByRole('button', { name: /Platform Guide Page/ });
    fireEvent.click(platform);
    fireEvent.click(screen.getByRole('button', { name: 'Expand Platform Guide' }));
    fireEvent.click(
      within(platform.closest('li')!).getByRole('button', { name: /Cards Card Container/ }),
    );
    expect(screen.getByRole('article', { name: 'Card preview' })).toHaveTextContent(
      'GitHub Actions',
    );
    expect(screen.queryByRole('button', { name: 'Next card' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Show card \d/ })).not.toBeInTheDocument();
  });

  it('reports an empty repository while keeping local page creation available', async () => {
    readSnapshot.mockResolvedValueOnce({
      ...repositorySnapshot,
      pages: [],
      cards: [],
    });
    render(
      <MemoryRouter>
        <BackendPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/This repository has no pages yet/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Select' }));
    expect(screen.getByRole('button', { name: 'New page' })).toBeEnabled();
  });

  it('reports repository read errors and allows retrying the read', async () => {
    readSnapshot
      .mockRejectedValueOnce(new Error('github_permission_denied'))
      .mockResolvedValueOnce(repositorySnapshot);
    render(
      <MemoryRouter>
        <BackendPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This account can no longer read the configured repository.',
    );
    expect(screen.getByRole('button', { name: 'Select' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Retry repository read' }));
    expect(await screen.findByRole('textbox', { name: 'Edit name' })).toBeInTheDocument();
    expect(readSnapshot).toHaveBeenCalledTimes(2);
  });

  it('keeps settings open after connect and tests the live repository in place', async () => {
    render(
      <MemoryRouter>
        <BackendPage />
      </MemoryRouter>,
    );
    const syncButton = screen.getByRole('button', { name: 'Github Sync' });

    fireEvent.click(syncButton);

    expect(
      screen.getByRole('dialog', { name: 'GitHub Repository Sync Settings' }),
    ).toBeInTheDocument();
    const tokenInput = screen.getByLabelText('GitHub Personal Access Token (PAT)');
    const saveButton = screen.getByRole('button', { name: 'Save & Connect' });
    expect(saveButton).toBeDisabled();
    fireEvent.change(tokenInput, { target: { value: 'temporary-test-token' } });
    expect(saveButton).toBeEnabled();
    fireEvent.click(saveButton);
    expect(loginWithPat).toHaveBeenCalledWith('temporary-test-token');
    expect(verifyGitHubPat).not.toHaveBeenCalled();
    expect(
      await screen.findByText(
        'Connection initialized. Use Connection Test to verify the live repository.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('dialog', { name: 'GitHub Repository Sync Settings' }),
    ).toBeInTheDocument();
    await waitFor(() => expect(readSnapshot).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByRole('button', { name: 'Connection Test' }));
    expect(
      await screen.findByText('Connection test passed. Read 3 pages and 3 cards from main.'),
    ).toBeInTheDocument();
    expect(readSnapshot).toHaveBeenCalledTimes(3);
    fireEvent.click(screen.getByRole('button', { name: 'Close GitHub sync' }));
    fireEvent.click(syncButton);
    expect(screen.getByLabelText('GitHub Personal Access Token (PAT)')).toHaveAttribute(
      'placeholder',
      'Connected for this browser session; token is hidden',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Connection Test' }));
    expect(
      await screen.findByText('Connection test passed. Read 3 pages and 3 cards from main.'),
    ).toBeInTheDocument();
    expect(readSnapshot).toHaveBeenCalledTimes(4);
  });

  it('keeps the GitHub sync dialog scoped to the first panel and restores focus on close', () => {
    const { container } = render(
      <MemoryRouter>
        <BackendPage />
      </MemoryRouter>,
    );
    const syncButton = screen.getByRole('button', { name: 'Github Sync' });
    const firstPanel = screen.getByRole('region', { name: 'Workspace panel 1' });
    const secondPanel = screen.getByRole('region', { name: 'Workspace panel 2' });

    fireEvent.click(syncButton);

    const syncPanel = screen.getByRole('dialog', { name: 'GitHub Repository Sync Settings' });
    expect(syncButton).toHaveAttribute('aria-expanded', 'true');
    expect(syncPanel.parentElement).toBe(firstPanel);
    expect(syncPanel.querySelector('.backend-github-sync-header')).toBeInTheDocument();
    expect(syncPanel.querySelector('.backend-github-sync-content')).toBeInTheDocument();
    expect(syncPanel.querySelector('.backend-github-sync-footer')).toBeInTheDocument();
    expect(screen.getByLabelText('GitHub Owner / Organization')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Repository Name')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Branch')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('GitHub Personal Access Token (PAT)')).toHaveAttribute(
      'type',
      'password',
    );
    expect(screen.getByRole('region', { name: 'Connection Test Results' })).toHaveTextContent(
      'Enter a GitHub token, then select Save & Connect to initialize the connection.',
    );
    expect(firstPanel.querySelector('.backend-workspace-panel-layout')).toHaveAttribute('inert');
    expect(secondPanel).not.toHaveAttribute('inert');
    expect(container.querySelector('.backend-workspace-container')).not.toHaveAttribute('inert');
    expect(screen.getByRole('button', { name: 'Close GitHub sync' })).toHaveFocus();

    fireEvent.keyDown(syncPanel, { key: 'Escape' });

    expect(
      screen.queryByRole('dialog', { name: 'GitHub Repository Sync Settings' }),
    ).not.toBeInTheDocument();
    expect(syncButton).toHaveAttribute('aria-expanded', 'false');
    expect(syncButton).toHaveFocus();

    fireEvent.click(syncButton);
    fireEvent.click(screen.getByRole('button', { name: 'Close GitHub sync' }));

    expect(
      screen.queryByRole('dialog', { name: 'GitHub Repository Sync Settings' }),
    ).not.toBeInTheDocument();
    expect(syncButton).toHaveFocus();
  });
});
