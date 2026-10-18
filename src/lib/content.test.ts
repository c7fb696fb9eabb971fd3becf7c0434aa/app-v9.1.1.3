import { describe, expect, it } from 'vitest';
import {
  CardContainerRecordV2Schema,
  CONTENT_SCHEMA_VERSION_V2,
  ContentRecordsV2Schema,
  containerStoragePath,
  migrateV1ContentRecords,
  type ContentRecordsV2,
} from './content';

const pageId = '11111111-1111-4111-8111-111111111111';
const nestedPageId = '22222222-2222-4222-8222-222222222222';
const cardId = '33333333-3333-4333-8333-333333333333';
const containerId = '44444444-4444-4444-8444-444444444444';

function validContainer(overrides: Partial<ContentRecordsV2['containers'][number]> = {}) {
  return {
    schemaVersion: CONTENT_SCHEMA_VERSION_V2,
    id: containerId,
    pageId,
    title: 'Cards',
    order: 0,
    ...overrides,
  };
}

function validV2Records(): ContentRecordsV2 {
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
    containers: [validContainer()],
    cards: [],
  };
}

function validV1Records() {
  return {
    schemaVersion: 1,
    pages: [
      {
        schemaVersion: 1,
        id: pageId,
        title: 'Platform',
        slug: 'platform',
        parentId: null,
        order: 0,
      },
      {
        schemaVersion: 1,
        id: nestedPageId,
        title: 'Operations',
        slug: 'operations',
        parentId: pageId,
        order: 0,
      },
    ],
    cards: [
      {
        schemaVersion: 1,
        id: cardId,
        pageId: nestedPageId,
        order: 0,
        title: 'Deployments',
        tag: 'CI/CD',
        definition: 'Deployment workflows.',
        attachments: [],
      },
    ],
  };
}

describe('container-based content schema', () => {
  it('accepts empty pages and empty containers', () => {
    expect(ContentRecordsV2Schema.safeParse(validV2Records()).success).toBe(true);
  });

  it('rejects a container whose owning page does not exist', () => {
    const records = validV2Records();
    records.containers[0] = validContainer({
      pageId: nestedPageId,
    });
    expect(ContentRecordsV2Schema.safeParse(records).success).toBe(false);
  });

  it('rejects pages with missing parents and cyclic page relationships', () => {
    const missingParent = validV2Records();
    missingParent.pages[0] = {
      ...missingParent.pages[0]!,
      parentId: nestedPageId,
    };
    expect(ContentRecordsV2Schema.safeParse(missingParent).success).toBe(false);

    const cyclic = validV2Records();
    cyclic.pages.push({
      schemaVersion: CONTENT_SCHEMA_VERSION_V2,
      id: nestedPageId,
      title: 'Operations',
      slug: 'operations',
      parentId: pageId,
      order: 0,
    });
    cyclic.pages[0] = {
      ...cyclic.pages[0]!,
      parentId: nestedPageId,
    };
    expect(ContentRecordsV2Schema.safeParse(cyclic).success).toBe(false);
  });

  it('rejects a card whose owning container does not exist', () => {
    const records = validV2Records();
    records.cards.push({
      schemaVersion: CONTENT_SCHEMA_VERSION_V2,
      id: cardId,
      containerId,
      order: 0,
      title: 'Deployments',
      definition: 'Deployment workflows.',
      attachments: [],
    });
    records.containers = [];
    expect(ContentRecordsV2Schema.safeParse(records).success).toBe(false);
  });

  it('rejects duplicate IDs across different record types', () => {
    const records = validV2Records();
    records.containers[0] = validContainer({ id: pageId });
    expect(ContentRecordsV2Schema.safeParse(records).success).toBe(false);
  });

  it('enforces stable container IDs and stores them in their own directory', () => {
    expect(
      CardContainerRecordV2Schema.safeParse(validContainer({ id: 'not-a-uuid' })).success,
    ).toBe(false);
    expect(containerStoragePath(containerId)).toBe(`content/containers/${containerId}.json`);
  });

  it('migrates legacy page cards into one stable-ID container per page', () => {
    let nextContainer = 0;
    const migrated = migrateV1ContentRecords(validV1Records(), () => {
      nextContainer += 1;
      return nextContainer === 1 ? containerId : '55555555-5555-4555-8555-555555555555';
    });

    expect(migrated.pages.map(({ id, parentId }) => ({ id, parentId }))).toEqual([
      { id: pageId, parentId: null },
      { id: nestedPageId, parentId: pageId },
    ]);
    expect(migrated.containers).toEqual([
      {
        schemaVersion: CONTENT_SCHEMA_VERSION_V2,
        id: containerId,
        pageId,
        title: 'Cards',
        order: 0,
      },
      {
        schemaVersion: CONTENT_SCHEMA_VERSION_V2,
        id: '55555555-5555-4555-8555-555555555555',
        pageId: nestedPageId,
        title: 'Cards',
        order: 0,
      },
    ]);
    expect(migrated.cards[0]).toMatchObject({
      schemaVersion: CONTENT_SCHEMA_VERSION_V2,
      id: cardId,
      containerId: '55555555-5555-4555-8555-555555555555',
      order: 0,
      title: 'Deployments',
      tag: 'CI/CD',
      definition: 'Deployment workflows.',
      attachments: [],
    });
    expect(ContentRecordsV2Schema.safeParse(migrated).success).toBe(true);
  });

  it('rejects malformed legacy data and colliding generated container IDs', () => {
    expect(() => migrateV1ContentRecords({ schemaVersion: 1 }, () => containerId)).toThrow(
      'legacy_content_invalid',
    );
    expect(() => migrateV1ContentRecords(validV1Records(), () => pageId)).toThrow(
      'migration_container_id_invalid',
    );
  });
});
