import { describe, expect, it } from 'vitest';
import { ContentRecordsV2Schema } from './content';
import { createV1ToV2MigrationPlan } from './content-migration';

const pageId = '11111111-1111-4111-8111-111111111111';
const emptyPageId = '22222222-2222-4222-8222-222222222222';
const firstCardId = '33333333-3333-4333-8333-333333333333';
const secondCardId = '44444444-4444-4444-8444-444444444444';
const pageContainerId = '55555555-5555-4555-8555-555555555555';
const emptyPageContainerId = '66666666-6666-4666-8666-666666666666';

const snapshot = {
  schemaVersion: 1 as const,
  sourceCommit: 'a'.repeat(40),
  repository: { owner: 'docs-owner', name: 'docs-repo', branch: 'main' },
  pages: [
    {
      schemaVersion: 1 as const,
      id: emptyPageId,
      title: 'Empty',
      slug: 'empty',
      parentId: null,
      order: 1,
    },
    {
      schemaVersion: 1 as const,
      id: pageId,
      title: 'Platform',
      slug: 'platform',
      parentId: null,
      order: 0,
      description: 'Platform docs',
    },
  ],
  cards: [
    {
      schemaVersion: 1 as const,
      id: secondCardId,
      pageId,
      order: 1,
      title: 'Second',
      definition: 'Second card.',
      attachments: [],
    },
    {
      schemaVersion: 1 as const,
      id: firstCardId,
      pageId,
      order: 0,
      title: 'First',
      definition: 'First card.',
      attachments: [],
    },
  ],
};

const mapping = {
  [pageId]: pageContainerId,
  [emptyPageId]: emptyPageContainerId,
};

describe('v1 to v2 migration plan', () => {
  it('returns deterministic, validated file changes without applying them', () => {
    const firstPlan = createV1ToV2MigrationPlan(snapshot, mapping);
    const secondPlan = createV1ToV2MigrationPlan(
      { ...snapshot, pages: [...snapshot.pages].reverse(), cards: [...snapshot.cards].reverse() },
      mapping,
    );

    expect(firstPlan).toEqual(secondPlan);
    expect(firstPlan).toMatchObject({
      sourceCommit: 'a'.repeat(40),
      sourceSchemaVersion: 1,
      targetSchemaVersion: 2,
      containerIdsByPageId: mapping,
      summary: {
        pages: 2,
        containersAdded: 2,
        cards: 2,
        filesAdded: 3,
        filesReplaced: 4,
      },
    });
    expect(firstPlan.changes.map(({ path, action }) => ({ path, action }))).toEqual(
      expect.arrayContaining([
        { path: 'content/manifest.json', action: 'add' },
        {
          path: `content/containers/${pageContainerId}.json`,
          action: 'add',
        },
        {
          path: `content/containers/${emptyPageContainerId}.json`,
          action: 'add',
        },
        { path: `content/pages/${pageId}.json`, action: 'replace' },
        { path: `content/pages/${emptyPageId}.json`, action: 'replace' },
        { path: `content/cards/${firstCardId}.json`, action: 'replace' },
        { path: `content/cards/${secondCardId}.json`, action: 'replace' },
      ]),
    );

    const migrated = {
      schemaVersion: 2 as const,
      pages: firstPlan.changes
        .filter(({ path }) => path.startsWith('content/pages/'))
        .map(({ content }) => JSON.parse(content)),
      containers: firstPlan.changes
        .filter(({ path }) => path.startsWith('content/containers/'))
        .map(({ content }) => JSON.parse(content)),
      cards: firstPlan.changes
        .filter(({ path }) => path.startsWith('content/cards/'))
        .map(({ content }) => JSON.parse(content)),
    };
    expect(ContentRecordsV2Schema.safeParse(migrated).success).toBe(true);
  });

  it('marks an empty migrated repository as schema v2', () => {
    const emptySnapshot = {
      schemaVersion: 1 as const,
      sourceCommit: 'b'.repeat(40),
      repository: snapshot.repository,
      pages: [],
      cards: [],
    };
    const plan = createV1ToV2MigrationPlan(emptySnapshot, {});

    expect(plan.changes).toEqual([
      {
        path: 'content/manifest.json',
        action: 'add',
        content: '{\n  "schemaVersion": 2\n}\n',
      },
    ]);
    expect(plan.summary).toMatchObject({ filesAdded: 1, filesReplaced: 0 });
  });

  it('requires an exact container-ID mapping for every page', () => {
    expect(() => createV1ToV2MigrationPlan(snapshot, { [pageId]: pageContainerId })).toThrow(
      'migration_container_mapping_incomplete',
    );
    expect(() =>
      createV1ToV2MigrationPlan(snapshot, {
        ...mapping,
        '77777777-7777-4777-8777-777777777777': '88888888-8888-4888-8888-888888888888',
      }),
    ).toThrow('migration_container_mapping_incomplete');
  });

  it('rejects an invalid source revision and colliding generated container IDs', () => {
    expect(() =>
      createV1ToV2MigrationPlan({ ...snapshot, sourceCommit: 'invalid' }, mapping),
    ).toThrow('migration_source_commit_invalid');
    expect(() =>
      createV1ToV2MigrationPlan(snapshot, {
        [pageId]: pageContainerId,
        [emptyPageId]: pageContainerId,
      }),
    ).toThrow('migration_container_id_invalid');
  });
});
