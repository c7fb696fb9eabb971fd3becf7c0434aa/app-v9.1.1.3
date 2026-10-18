import { describe, expect, it } from 'vitest';
import {
  CONTENT_SCHEMA_VERSION_V2,
  type RepositorySnapshotResponse,
  type RepositoryV1SnapshotResponse,
} from '../lib/content';
import { explorerRecordsToV2Content } from './backendRepositoryContent';

const pageId = '11111111-1111-4111-8111-111111111111';
const containerId = '22222222-2222-4222-8222-222222222222';
const cardId = '33333333-3333-4333-8333-333333333333';
const snapshot: RepositorySnapshotResponse = {
  schemaVersion: CONTENT_SCHEMA_VERSION_V2,
  sourceCommit: 'a'.repeat(40),
  repository: { owner: 'docs-owner', name: 'docs-repo', branch: 'main' },
  pages: [
    {
      schemaVersion: CONTENT_SCHEMA_VERSION_V2,
      id: pageId,
      title: 'Platform',
      slug: 'platform',
      parentId: null,
      order: 0,
      description: 'Original description.',
    },
  ],
  containers: [
    {
      schemaVersion: CONTENT_SCHEMA_VERSION_V2,
      id: containerId,
      pageId,
      title: 'Guides',
      order: 0,
    },
  ],
  cards: [
    {
      schemaVersion: CONTENT_SCHEMA_VERSION_V2,
      id: cardId,
      containerId,
      order: 0,
      title: 'Install',
      tag: 'Setup',
      definition: 'Original card.',
      keyRule: 'Keep this rule.',
      code: 'npm install',
      spec: 'Keep this spec.',
      attachments: [],
    },
  ],
};

describe('backend repository content serialization', () => {
  it('preserves stable IDs and untouched card fields while serializing edits', () => {
    const records = [
      {
        id: pageId,
        kind: 'page' as const,
        title: 'Platform revised',
        parentId: null,
        order: 0,
        summary: 'Updated description.',
        category: 'Documentation',
      },
      {
        id: containerId,
        kind: 'container' as const,
        title: 'Guides',
        parentId: pageId,
        order: 0,
        summary: 'Container summary is not part of schema v2.',
        category: 'Platform revised',
      },
      {
        id: cardId,
        kind: 'card' as const,
        title: 'Install revised',
        parentId: containerId,
        order: 0,
        summary: 'Updated card content.',
        category: 'Platform revised',
        tag: '',
        parentTitle: 'Guides',
        parentCategory: 'Platform revised',
      },
    ];

    const result = explorerRecordsToV2Content(records, snapshot);

    expect(result.pages[0]).toMatchObject({
      id: pageId,
      title: 'Platform revised',
      slug: 'platform',
      description: 'Updated description.',
    });
    expect(result.cards[0]).toMatchObject({
      id: cardId,
      containerId,
      title: 'Install revised',
      definition: 'Updated card content.',
      keyRule: 'Keep this rule.',
      code: 'npm install',
      spec: 'Keep this spec.',
      attachments: [],
    });
    expect(result.cards[0]).not.toHaveProperty('tag');
  });

  it('generates valid unique IDs and slugs for new tree records', () => {
    const records = [
      {
        id: 'mock-page-1',
        kind: 'page' as const,
        title: 'New Page',
        parentId: null,
        order: 1,
        summary: '',
        category: 'Documentation',
      },
      {
        id: 'mock-container-1',
        kind: 'container' as const,
        title: 'Cards',
        parentId: 'mock-page-1',
        order: 0,
        summary: '',
        category: 'Documentation',
      },
      {
        id: 'mock-card-1',
        kind: 'card' as const,
        title: 'New Card',
        parentId: 'mock-container-1',
        order: 0,
        summary: 'New card content.',
        category: 'Documentation',
        parentTitle: 'Cards',
        parentCategory: 'Documentation',
      },
    ];

    const result = explorerRecordsToV2Content(records, {
      ...snapshot,
      pages: [],
      containers: [],
      cards: [],
    });

    expect(result.pages[0]?.slug).toBe('new-page');
    expect(result.pages[0]?.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.containers[0]?.pageId).toBe(result.pages[0]?.id);
    expect(result.cards[0]?.containerId).toBe(result.containers[0]?.id);
  });

  it('refuses to publish local records over a schema-v1 repository snapshot', () => {
    const v1Snapshot: RepositoryV1SnapshotResponse = {
      schemaVersion: 1,
      sourceCommit: snapshot.sourceCommit,
      repository: snapshot.repository,
      pages: [],
      cards: [],
    };
    expect(() => explorerRecordsToV2Content([], v1Snapshot)).toThrow(
      'repository_migration_required',
    );
  });
});
