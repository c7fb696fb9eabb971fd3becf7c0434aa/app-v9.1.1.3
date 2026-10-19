import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BackendPage } from './BackendPage';
import { BackendTree, INITIAL_EXPLORER_RECORD, INITIAL_EXPLORER_RECORDS } from './BackendTree';

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

const repositorySnapshot = {
  schemaVersion: 2 as const,
  sourceCommit: 'a'.repeat(40),
  repository: { owner: 'docs-owner', name: 'docs-repo', branch: 'main' },
  pages: [
    {
      schemaVersion: 2 as const,
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Machine Learning',
      slug: 'machine-learning',
      parentId: null,
      order: 0,
    },
    {
      schemaVersion: 2 as const,
      id: '22222222-2222-4222-8222-222222222222',
      title: 'Neural Networks',
      slug: 'neural-networks',
      parentId: '11111111-1111-4111-8111-111111111111',
      order: 0,
    },
    {
      schemaVersion: 2 as const,
      id: '33333333-3333-4333-8333-333333333333',
      title: 'Platform Guide',
      slug: 'platform-guide',
      parentId: null,
      order: 1,
    },
  ],
  containers: [
    {
      schemaVersion: 2 as const,
      id: '77777777-7777-4777-8777-777777777777',
      pageId: '11111111-1111-4111-8111-111111111111',
      title: 'Cards',
      order: 0,
    },
    {
      schemaVersion: 2 as const,
      id: '88888888-8888-4888-8888-888888888888',
      pageId: '22222222-2222-4222-8222-222222222222',
      title: 'Cards',
      order: 0,
    },
    {
      schemaVersion: 2 as const,
      id: '99999999-9999-4999-8999-999999999999',
      pageId: '33333333-3333-4333-8333-333333333333',
      title: 'Cards',
      order: 0,
    },
  ],
  cards: [
    {
      schemaVersion: 2 as const,
      id: '44444444-4444-4444-8444-444444444444',
      containerId: '77777777-7777-4777-8777-777777777777',
      order: 0,
      title: 'Tensor Flow',
      definition: 'Tensor details.',
      attachments: [],
    },
    {
      schemaVersion: 2 as const,
      id: '55555555-5555-4555-8555-555555555555',
      containerId: '77777777-7777-4777-8777-777777777777',
      order: 1,
      title: 'Training Fundamentals',
      definition: 'Training details.',
      attachments: [],
    },
    {
      schemaVersion: 2 as const,
      id: '66666666-6666-4666-8666-666666666666',
      containerId: '99999999-9999-4999-8999-999999999999',
      order: 0,
      title: 'GitHub Actions',
      definition: 'Automation details.',
      attachments: [],
    },
  ],
};

beforeEach(() => {
  readSnapshot.mockResolvedValue(repositorySnapshot);
});

function openExplorer() {
  fireEvent.click(screen.getByRole('button', { name: 'Select' }));
}

function saveCurrentName(previousTitle: string, nextTitle: string) {
  fireEvent.change(screen.getByRole('textbox', { name: `Rename ${previousTitle}` }), {
    target: { value: nextTitle },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
}

describe('Backend workspace tree', () => {
  it('shows repository content and updates the workspace preview when an item is selected', async () => {
    render(
      <MemoryRouter>
        <BackendPage />
      </MemoryRouter>,
    );
    await screen.findByRole('textbox', { name: 'Edit name' });
    openExplorer();
    fireEvent.click(screen.getByRole('button', { name: 'Expand Machine Learning' }));
    fireEvent.click(screen.getByRole('button', { name: 'Expand Cards' }));

    expect(screen.getByRole('heading', { name: 'Realtime Tree' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Machine Learning Page/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tensor Flow Card/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cards Card Container/ })).toBeInTheDocument();
    expect(document.querySelectorAll('.backend-tree-children').length).toBeGreaterThanOrEqual(2);
    fireEvent.click(screen.getByRole('button', { name: 'Collapse Machine Learning' }));
    expect(screen.queryByRole('button', { name: /Tensor Flow Card/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Expand Machine Learning' }));

    fireEvent.click(screen.getByRole('button', { name: /Neural Networks Subpage/ }));
    expect(screen.getByRole('article', { name: 'Card preview' })).toHaveTextContent(
      'Select a card container from the workspace explorer.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close explorer' }));
    expect(screen.getByRole('heading', { name: 'Select a card container' })).toBeInTheDocument();
  });

  it('creates pages with default containers and cards in selected containers', async () => {
    render(
      <MemoryRouter>
        <BackendPage />
      </MemoryRouter>,
    );
    await screen.findByRole('textbox', { name: 'Edit name' });
    openExplorer();
    fireEvent.click(screen.getByRole('button', { name: 'Expand Machine Learning' }));
    fireEvent.click(screen.getByRole('button', { name: 'Expand Neural Networks' }));
    fireEvent.click(screen.getByRole('button', { name: 'Expand Platform Guide' }));

    fireEvent.click(screen.getByRole('button', { name: 'New page' }));
    saveCurrentName('New page', 'Release Notes');
    expect(screen.getByRole('button', { name: /Release Notes Page/ })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Cards Card Container/ })).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'New card' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'New nested page' }));
    saveCurrentName('New nested page', 'Version 1');
    expect(screen.getByRole('button', { name: /Version 1 Subpage/ })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Cards Card Container/ })).toHaveLength(5);

    fireEvent.click(screen.getByRole('button', { name: 'New card container' }));
    saveCurrentName('New card container', 'Version Cards');
    expect(screen.getByRole('button', { name: 'New card' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'New card' }));
    saveCurrentName('New card', 'Migration checklist');
    expect(screen.getByRole('button', { name: /Migration checklist Card/ })).toBeInTheDocument();
  });

  it('reorders repository siblings and confirms cascading deletion locally', async () => {
    render(
      <MemoryRouter>
        <BackendPage />
      </MemoryRouter>,
    );
    await screen.findByRole('textbox', { name: 'Edit name' });
    openExplorer();

    fireEvent.click(screen.getByRole('button', { name: 'Expand Machine Learning' }));
    const machineLearning = screen
      .getByRole('button', { name: /Machine Learning Page/ })
      .closest('li');
    const children = machineLearning?.querySelector(':scope > .backend-tree-children');
    expect(children).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Move Cards up' }));
    expect(
      Array.from(
        children!.querySelectorAll(':scope > li > .backend-tree-row .backend-tree-title'),
      ).map((item) => item.textContent),
    ).toEqual(['Cards', 'Neural Networks']);

    fireEvent.click(screen.getByRole('button', { name: 'Delete Machine Learning' }));
    expect(screen.getByRole('alert')).toHaveTextContent('and all nested items');
    fireEvent.click(within(screen.getByRole('alert')).getByRole('button', { name: 'Delete' }));

    expect(screen.queryByRole('button', { name: /Machine Learning Page/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Tensor Flow Card/ })).not.toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Card preview' })).toHaveTextContent(
      'Select a card container from the workspace explorer.',
    );
  });

  it('discards local tree changes back to the repository snapshot baseline', async () => {
    render(
      <MemoryRouter>
        <BackendPage />
      </MemoryRouter>,
    );
    await screen.findByRole('textbox', { name: 'Edit name' });
    openExplorer();
    fireEvent.click(screen.getByRole('button', { name: 'Rename Machine Learning' }));
    saveCurrentName('Machine Learning', 'Locally renamed');
    expect(screen.getByRole('button', { name: /Locally renamed Page/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    const confirmation = screen.getByRole('group', { name: 'Confirm discard changes' });
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Discard' }));

    expect(screen.getByRole('button', { name: /Machine Learning Page/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Locally renamed Page/ })).not.toBeInTheDocument();
    expect(screen.getByText('0 changes')).toBeInTheDocument();
  });
});

describe('Backend tree panel styling hooks', () => {
  it('renders containers and cards as panels and styles expanded disclosures', () => {
    render(
      <BackendTree
        records={[...INITIAL_EXPLORER_RECORDS]}
        initialRecords={INITIAL_EXPLORER_RECORDS}
        onRecordsChange={() => {}}
        selectedRecord={INITIAL_EXPLORER_RECORD}
        onSelectionChange={() => {}}
        onClose={() => {}}
        closeLabel="Close explorer"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Expand Machine Learning' }));
    const containerButton = screen.getByRole('button', {
      name: /Data Engineering Card Container/,
    });
    fireEvent.click(containerButton);
    fireEvent.click(screen.getByRole('button', { name: 'Expand Data Engineering' }));
    const cardButton = screen.getByRole('button', { name: /Data Pipelines Card/ });
    expect(
      screen.getByRole('button', { name: /Machine Learning Page/ }).closest('.backend-tree-row'),
    ).toHaveClass('backend-tree-row');
    expect(containerButton.closest('.backend-tree-row')).toHaveClass(
      'backend-tree-row',
      'is-selected',
    );
    expect(cardButton.closest('.backend-tree-row')).toHaveClass('backend-tree-row', 'is-leaf');
    expect(screen.getByRole('button', { name: 'Collapse Machine Learning' })).toHaveClass(
      'backend-tree-disclosure',
      'is-expanded',
    );
    expect(
      containerButton.closest('li')?.querySelector(':scope > .backend-tree-children'),
    ).toBeInTheDocument();
  });
});
