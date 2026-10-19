import { describe, expect, it } from 'vitest';
import type { RepositorySnapshotResponse } from '../lib/content';
import {
  defaultExplorerSelection,
  repositorySnapshotToExplorerRecords,
} from './backendRepositoryRecords';

const snapshot: RepositorySnapshotResponse = {
  schemaVersion: 2,
  sourceCommit: 'a'.repeat(40),
  repository: { owner: 'docs-owner', name: 'docs-repo', branch: 'main' },
  pages: [
    {
      schemaVersion: 2,
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Parent',
      slug: 'parent',
      parentId: null,
      order: 0,
      description: 'Parent description.',
    },
    {
      schemaVersion: 2,
      id: '22222222-2222-4222-8222-222222222222',
      title: 'Nested',
      slug: 'nested',
      parentId: '11111111-1111-4111-8111-111111111111',
      order: 0,
    },
    {
      schemaVersion: 2,
      id: '33333333-3333-4333-8333-333333333333',
      title: 'Empty',
      slug: 'empty',
      parentId: null,
      order: 1,
    },
  ],
  containers: [
    {
      schemaVersion: 2,
      id: '77777777-7777-4777-8777-777777777777',
      pageId: '11111111-1111-4111-8111-111111111111',
      title: 'Parent Cards',
      order: 0,
    },
    {
      schemaVersion: 2,
      id: '88888888-8888-4888-8888-888888888888',
      pageId: '22222222-2222-4222-8222-222222222222',
      title: 'Nested Cards',
      order: 0,
    },
    {
      schemaVersion: 2,
      id: '99999999-9999-4999-8999-999999999999',
      pageId: '33333333-3333-4333-8333-333333333333',
      title: 'Empty Cards',
      order: 0,
    },
  ],
  cards: [
    {
      schemaVersion: 2,
      id: '44444444-4444-4444-8444-444444444444',
      containerId: '77777777-7777-4777-8777-777777777777',
      order: 0,
      title: 'Card',
      tag: 'Tag',
      definition: 'Card definition.',
      keyRule: 'Preserve this rule.',
      code: 'npm install',
      spec: 'Node 24.',
      attachments: [],
    },
  ],
};

describe('repository snapshot explorer records', () => {
  it('maps pages, nested pages, persisted containers, and cards into the explorer hierarchy', () => {
    const first = repositorySnapshotToExplorerRecords(snapshot);
    const second = repositorySnapshotToExplorerRecords(snapshot);

    expect(first).toEqual(second);
    expect(first).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: '11111111-1111-4111-8111-111111111111',
          kind: 'page',
          parentId: null,
        }),
        expect.objectContaining({
          id: '22222222-2222-4222-8222-222222222222',
          kind: 'subpage',
          parentId: '11111111-1111-4111-8111-111111111111',
        }),
        expect.objectContaining({
          id: '77777777-7777-4777-8777-777777777777',
          kind: 'container',
          title: 'Parent Cards',
          parentId: '11111111-1111-4111-8111-111111111111',
          order: 0,
        }),
        expect.objectContaining({
          id: '44444444-4444-4444-8444-444444444444',
          kind: 'card',
          parentId: '77777777-7777-4777-8777-777777777777',
          summary: 'Card definition.',
          tag: 'Tag',
          keyRule: 'Preserve this rule.',
          code: 'npm install',
          spec: 'Node 24.',
        }),
        expect.objectContaining({
          id: '99999999-9999-4999-8999-999999999999',
          kind: 'container',
        }),
      ]),
    );
    expect(defaultExplorerSelection(first)).toBe('77777777-7777-4777-8777-777777777777');
  });

  it('provides no default selection for an empty repository', () => {
    expect(
      defaultExplorerSelection(
        repositorySnapshotToExplorerRecords({
          ...snapshot,
          pages: [],
          containers: [],
          cards: [],
        }),
      ),
    ).toBe('');
  });

  it('maps persisted v2 container IDs and cards into the explorer hierarchy', () => {
    const snapshot: RepositorySnapshotResponse = {
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
    };

    expect(repositorySnapshotToExplorerRecords(snapshot)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: '22222222-2222-4222-8222-222222222222',
          kind: 'container',
          parentId: '11111111-1111-4111-8111-111111111111',
          title: 'Guides',
        }),
        expect.objectContaining({
          id: '33333333-3333-4333-8333-333333333333',
          kind: 'card',
          parentId: '22222222-2222-4222-8222-222222222222',
          parentTitle: 'Guides',
        }),
      ]),
    );
  });
});
