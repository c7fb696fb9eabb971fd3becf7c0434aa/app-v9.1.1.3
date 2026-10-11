import { describe, expect, it } from 'vitest';
import {
  assetStoragePath,
  AttachmentSchema,
  buildPageTree,
  CardRecordSchema,
  ContentIndexSchema,
  ContentRecordsSchema,
  CONTENT_LIMITS,
  createContentIndex,
  normalizeSlug,
  PageRecordSchema,
  pageStoragePath,
  SCHEMA_VERSION,
  type PageRecord,
} from './index.js';

const rootId = '550e8400-e29b-41d4-a716-446655440000';
const childId = '550e8400-e29b-41d4-a716-446655440001';
const cardId = '550e8400-e29b-41d4-a716-446655440002';

function page(
  id: string,
  title: string,
  slug: string,
  parentId: string | null,
  order: number,
): PageRecord {
  return { schemaVersion: SCHEMA_VERSION, id, title, slug, parentId, order };
}

describe('content schemas and storage contract', () => {
  it('uses stable-ID paths and normalizes titles without making slugs record identity', () => {
    expect(pageStoragePath(rootId)).toBe(`content/pages/${rootId}.json`);
    expect(assetStoragePath(rootId, 'image/png')).toBe(`content/media/${rootId}.png`);
    expect(() => pageStoragePath('../escape')).toThrow();
    expect(normalizeSlug('Crème & CUDA 12')).toBe('creme-cuda-12');
    expect(normalizeSlug('***')).toBe('untitled');
  });

  it('rejects invalid records and invalid attachment URLs/types/size', () => {
    const result = CardRecordSchema.safeParse({
      schemaVersion: SCHEMA_VERSION,
      id: cardId,
      pageId: rootId,
      order: 0,
      title: 'Card',
      definition: 'Definition',
      attachments: [
        {
          id: childId,
          kind: 'link',
          label: 'Bad link',
          url: 'javascript:alert(1)',
        },
      ],
    });
    expect(result.success).toBe(false);
    expect(() => assetStoragePath(rootId, 'image/svg+xml')).toThrow('Unsupported asset MIME type');
    expect(
      AttachmentSchema.safeParse({
        id: childId,
        kind: 'image',
        label: 'Oversized image',
        assetId: rootId,
        mimeType: 'image/png',
        sizeBytes: CONTENT_LIMITS.assetBytes + 1,
      }).success,
    ).toBe(false);
  });

  it('rejects duplicate sibling slugs, missing parents, missing card pages, and hierarchy cycles', () => {
    const result = ContentRecordsSchema.safeParse({
      schemaVersion: SCHEMA_VERSION,
      pages: [
        page(rootId, 'Root', 'guide', childId, 0),
        page(childId, 'Child', 'guide', rootId, 0),
        page('550e8400-e29b-41d4-a716-446655440003', 'Top One', 'top', null, 0),
        page('550e8400-e29b-41d4-a716-446655440004', 'Top Two', 'top', null, 1),
      ],
      cards: [
        {
          schemaVersion: SCHEMA_VERSION,
          id: cardId,
          pageId: '550e8400-e29b-41d4-a716-446655440005',
          order: 0,
          title: 'Card',
          definition: 'Definition',
          attachments: [],
        },
      ],
    });
    expect(result.success).toBe(false);
    if (result.success) throw new Error('Expected invalid content records');
    expect(result.error.issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        'Page slug must be unique among siblings',
        'Page hierarchy cannot contain cycles',
        'Card page does not exist',
      ]),
    );
  });

  it('reconstructs hierarchy deterministically by order, slug, and stable ID', () => {
    const pages = [
      page(childId, 'Second child', 'second', rootId, 1),
      page(rootId, 'Guide', 'guide', null, 0),
      page(cardId, 'First child', 'first', rootId, 0),
    ];
    const tree = buildPageTree(pages);
    const reversedTree = buildPageTree([...pages].reverse());
    expect(tree.map((node) => node.id)).toEqual([rootId]);
    expect(tree[0]?.children.map((node) => node.slug)).toEqual(['first', 'second']);
    expect(reversedTree).toEqual(tree);
  });

  it('validates public indexes with their source commit and record relationships', () => {
    const index = ContentIndexSchema.safeParse({
      schemaVersion: SCHEMA_VERSION,
      sourceCommit: 'a'.repeat(40),
      pages: [page(rootId, 'Guide', 'guide', null, 0)],
      cards: [],
    });
    const invalidIndex = ContentIndexSchema.safeParse({
      schemaVersion: SCHEMA_VERSION,
      sourceCommit: 'not-a-commit',
      pages: [page(rootId, 'Guide', 'guide', childId, 0)],
      cards: [],
    });

    expect(index.success).toBe(true);
    expect(invalidIndex.success).toBe(false);
  });

  it('builds a deterministic public index tied to its source commit', () => {
    const records = {
      schemaVersion: SCHEMA_VERSION,
      pages: [page(childId, 'Child', 'child', rootId, 1), page(rootId, 'Guide', 'guide', null, 0)],
      cards: [
        {
          schemaVersion: SCHEMA_VERSION,
          id: cardId,
          pageId: rootId,
          order: 0,
          title: 'Card',
          definition: 'Definition',
          attachments: [],
        },
      ],
    };

    expect(createContentIndex(records, 'a'.repeat(40))).toEqual(
      createContentIndex({ ...records, pages: [...records.pages].reverse() }, 'a'.repeat(40)),
    );
    expect(() => createContentIndex(records, 'not-a-commit')).toThrow();
    expect(
      PageRecordSchema.safeParse({
        ...page(rootId, 'Guide', 'guide', null, 0),
        order: CONTENT_LIMITS.orderValue + 1,
      }).success,
    ).toBe(false);
  });
});
