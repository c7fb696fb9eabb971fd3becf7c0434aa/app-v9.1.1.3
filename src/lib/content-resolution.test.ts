import { describe, expect, it } from 'vitest';
import {
  CONTENT_SCHEMA_VERSION_V2,
  type ContentRecordsV2,
  type RepositorySnapshotResponse,
} from './content';
import {
  orderedContainersForPage,
  resolveCardContainer,
  resolveContainerPreview,
  resolveRepositoryPagePreviews,
} from './content-resolution';

const pageId = '11111111-1111-4111-8111-111111111111';
const firstContainerId = '22222222-2222-4222-8222-222222222222';
const secondContainerId = '33333333-3333-4333-8333-333333333333';
const firstCardId = '44444444-4444-4444-8444-444444444444';
const secondCardId = '55555555-5555-4555-8555-555555555555';

function recordsWithCards(): ContentRecordsV2 {
  return {
    schemaVersion: CONTENT_SCHEMA_VERSION_V2,
    pages: [
      {
        schemaVersion: CONTENT_SCHEMA_VERSION_V2,
        id: pageId,
        title: 'Platform',
        slug: 'platform',
        parentId: null,
        order: 0,
      },
    ],
    containers: [
      {
        schemaVersion: CONTENT_SCHEMA_VERSION_V2,
        id: secondContainerId,
        pageId,
        title: 'Second',
        order: 1,
      },
      {
        schemaVersion: CONTENT_SCHEMA_VERSION_V2,
        id: firstContainerId,
        pageId,
        title: 'First',
        order: 0,
      },
    ],
    cards: [
      {
        schemaVersion: CONTENT_SCHEMA_VERSION_V2,
        id: secondCardId,
        containerId: firstContainerId,
        order: 1,
        title: 'Second card',
        definition: 'Second card content.',
        attachments: [],
      },
      {
        schemaVersion: CONTENT_SCHEMA_VERSION_V2,
        id: firstCardId,
        containerId: firstContainerId,
        order: 0,
        title: 'First card',
        definition: 'First card content.',
        attachments: [],
      },
    ],
  };
}

describe('container preview resolution', () => {
  it('orders a page’s containers and each container’s cards deterministically', () => {
    const records = recordsWithCards();

    expect(orderedContainersForPage(records, pageId).map((item) => item.id)).toEqual([
      firstContainerId,
      secondContainerId,
    ]);
    expect(resolveContainerPreview(records, firstContainerId).cards.map((item) => item.id)).toEqual(
      [firstCardId, secondCardId],
    );
  });

  it('resolves empty containers without an active card or carousel indicators', () => {
    const preview = resolveContainerPreview(recordsWithCards(), secondContainerId);

    expect(preview.cards).toEqual([]);
    expect(preview.activeCard).toBeNull();
    expect(preview.showCarouselIndicators).toBe(false);
  });

  it('resolves a single card without carousel indicators', () => {
    const records = recordsWithCards();
    records.cards = records.cards.filter((card) => card.id === firstCardId);

    const preview = resolveContainerPreview(records, firstContainerId);

    expect(preview.activeCard?.id).toBe(firstCardId);
    expect(preview.showCarouselIndicators).toBe(false);
  });

  it('selects the requested card so editor and preview can share an active record ID', () => {
    const preview = resolveContainerPreview(recordsWithCards(), firstContainerId, secondCardId);

    expect(preview.activeCard?.id).toBe(secondCardId);
    expect(preview.activeCard?.title).toBe('Second card');
    expect(preview.showCarouselIndicators).toBe(true);
  });

  it('rejects missing containers, unrelated active cards, and missing pages', () => {
    const records = recordsWithCards();

    expect(() => resolveContainerPreview(records, '66666666-6666-4666-8666-666666666666')).toThrow(
      'container_not_found',
    );
    expect(() => resolveContainerPreview(records, secondContainerId, firstCardId)).toThrow(
      'card_not_in_container',
    );
    expect(() => orderedContainersForPage(records, '66666666-6666-4666-8666-666666666666')).toThrow(
      'page_not_found',
    );
  });

  it('resolves persisted containers with stable ordering and selection rules', () => {
    const containers = [{ id: 'persisted-container', title: 'Cards' }];
    const cards = [
      { id: 'second', containerId: 'persisted-container', order: 1, title: 'Second' },
      { id: 'first', containerId: 'persisted-container', order: 0, title: 'First' },
    ];

    expect(resolveCardContainer(containers, cards, 'persisted-container').cards).toEqual([
      cards[1],
      cards[0],
    ]);
    expect(
      resolveCardContainer(containers, cards, 'persisted-container', 'second').activeCard,
    ).toEqual(cards[0]);
    expect(
      resolveCardContainer(
        containers,
        [
          { id: 'z-card', containerId: 'persisted-container', order: 0, title: 'Z' },
          { id: 'a-card', containerId: 'persisted-container', order: 0, title: 'A' },
        ],
        'persisted-container',
      ).cards.map((card) => card.id),
    ).toEqual(['a-card', 'z-card']);
    expect(() => resolveCardContainer(containers, cards, 'missing')).toThrow('container_not_found');
    expect(() => resolveCardContainer(containers, cards, 'persisted-container', '')).toThrow(
      'card_not_in_container',
    );
  });

  it('returns no container previews for a v2 page without persisted containers', () => {
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
        },
      ],
      containers: [],
      cards: [],
    };

    expect(resolveRepositoryPagePreviews(snapshot, pageId)).toEqual([]);
    expect(() =>
      resolveRepositoryPagePreviews(snapshot, '66666666-6666-4666-8666-666666666666'),
    ).toThrow('page_not_found');
  });

  it('resolves all persisted v2 containers independently for a page', () => {
    const records = recordsWithCards();
    const snapshot: RepositorySnapshotResponse = {
      schemaVersion: CONTENT_SCHEMA_VERSION_V2,
      sourceCommit: 'a'.repeat(40),
      repository: { owner: 'docs-owner', name: 'docs-repo', branch: 'main' },
      pages: records.pages,
      containers: records.containers,
      cards: records.cards,
    };

    const previews = resolveRepositoryPagePreviews(snapshot, pageId, {
      [firstContainerId]: secondCardId,
    });

    expect(previews.map((preview) => preview.container.id)).toEqual([
      firstContainerId,
      secondContainerId,
    ]);
    expect(previews[0]?.activeCard?.id).toBe(secondCardId);
    expect(previews[1]?.activeCard).toBeNull();
  });
});
