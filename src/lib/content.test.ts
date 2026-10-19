import { describe, expect, it } from 'vitest';
import {
  CardContainerRecordV2Schema,
  AttachmentSchema,
  CONTENT_SCHEMA_VERSION_V2,
  ContentRecordsV2Schema,
  containerStoragePath,
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

  it('accepts format-aware remote media URLs while keeping external links separate', () => {
    expect(
      AttachmentSchema.safeParse({
        id: '55555555-5555-4555-8555-555555555555',
        kind: 'audio',
        label: 'Release audio',
        url: 'https://cdn.example.test/release.ogg',
        mimeType: 'audio/ogg',
      }).success,
    ).toBe(true);
    expect(
      AttachmentSchema.safeParse({
        id: '66666666-6666-4666-8666-666666666666',
        kind: 'link',
        label: 'Reference',
        url: 'https://example.test/reference',
      }).success,
    ).toBe(true);
    expect(
      AttachmentSchema.safeParse({
        id: '77777777-7777-4777-8777-777777777777',
        kind: 'audio',
        label: 'Invalid audio',
        url: 'javascript:alert(1)',
        mimeType: 'audio/ogg',
      }).success,
    ).toBe(false);
    expect(
      AttachmentSchema.safeParse({
        id: '99999999-9999-4999-8999-999999999999',
        kind: 'audio',
        label: 'Insecure media',
        url: 'http://cdn.example.test/release.ogg',
        mimeType: 'audio/ogg',
      }).success,
    ).toBe(false);
    expect(
      AttachmentSchema.safeParse({
        id: '88888888-8888-4888-8888-888888888888',
        kind: 'audio',
        label: 'Mismatched format',
        url: 'https://example.test/release.mp3',
        mimeType: 'video/mp4',
      }).success,
    ).toBe(false);
  });
});
