import {
  CONTENT_SCHEMA_VERSION_V2,
  ContentRecordsV2Schema,
  type ContentRecordsV2,
  type RepositorySnapshotResponse,
} from '../lib/content';
import type { ExplorerRecord } from './BackendTree';

const STABLE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function createStableId(): string {
  if (typeof crypto.randomUUID !== 'function') throw new Error('stable_id_generation_unavailable');
  return crypto.randomUUID();
}

function slugFromTitle(title: string): string {
  const slug = title
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 160)
    .replace(/-+$/g, '');
  if (!slug) throw new Error('page_slug_invalid');
  return slug;
}

export function explorerRecordsToV2Content(
  records: readonly ExplorerRecord[],
  snapshot: RepositorySnapshotResponse,
): ContentRecordsV2 {
  if (snapshot.schemaVersion !== CONTENT_SCHEMA_VERSION_V2) {
    throw new Error('repository_migration_required');
  }

  const idByExplorerId = new Map<string, string>();
  const allIds = new Set<string>();
  for (const record of records) {
    const id = STABLE_ID_PATTERN.test(record.id) ? record.id : createStableId();
    if (allIds.has(id)) throw new Error('record_id_collision');
    allIds.add(id);
    idByExplorerId.set(record.id, id);
  }
  const pageRecords = records.filter(
    (record): record is Extract<ExplorerRecord, { kind: 'page' | 'subpage' }> =>
      record.kind === 'page' || record.kind === 'subpage',
  );
  const pageByExplorerId = new Map(pageRecords.map((record) => [record.id, record]));
  const usedSlugs = new Set<string>();
  const pages = pageRecords.map((record) => {
    const id = idByExplorerId.get(record.id);
    if (!id) throw new Error('record_identity_missing');
    const parentId =
      record.parentId === null ? null : (idByExplorerId.get(record.parentId) ?? null);
    if (record.parentId !== null && (!parentId || !pageByExplorerId.has(record.parentId))) {
      throw new Error('page_parent_invalid');
    }
    const original = snapshot.pages.find((page) => page.id === id);
    const baseSlug = original?.slug ?? slugFromTitle(record.title);
    let slug = baseSlug;
    const siblingKey = (candidate: string) => `${parentId ?? 'root'}:${candidate}`;
    let suffix = 2;
    while (usedSlugs.has(siblingKey(slug))) slug = `${baseSlug}-${suffix++}`;
    usedSlugs.add(siblingKey(slug));
    return {
      ...original,
      schemaVersion: CONTENT_SCHEMA_VERSION_V2,
      id,
      title: record.title,
      slug,
      parentId,
      order: record.order,
      ...(record.summary ? { description: record.summary } : { description: undefined }),
    };
  });

  const containers = records
    .filter(
      (record): record is Extract<ExplorerRecord, { kind: 'container' }> =>
        record.kind === 'container',
    )
    .map((record) => {
      const id = idByExplorerId.get(record.id);
      const pageId = idByExplorerId.get(record.parentId);
      if (!id || !pageId || !pageByExplorerId.has(record.parentId)) {
        throw new Error('container_parent_invalid');
      }
      return {
        schemaVersion: CONTENT_SCHEMA_VERSION_V2,
        id,
        pageId,
        title: record.title,
        order: record.order,
      };
    });

  const originalCards = snapshot.schemaVersion === CONTENT_SCHEMA_VERSION_V2 ? snapshot.cards : [];
  const cards = records
    .filter((record): record is Extract<ExplorerRecord, { kind: 'card' }> => record.kind === 'card')
    .map((record) => {
      const id = idByExplorerId.get(record.id);
      const containerId = idByExplorerId.get(record.parentId);
      const original = originalCards.find((card) => card.id === id);
      if (!id || !containerId || !containers.some((container) => container.id === containerId)) {
        throw new Error('card_container_invalid');
      }
      const tag = record.tag?.trim();
      const originalFields = original
        ? (({ tag: _originalTag, ...fields }) => fields)(original)
        : {};
      return {
        ...originalFields,
        schemaVersion: CONTENT_SCHEMA_VERSION_V2,
        id,
        containerId,
        order: record.order,
        title: record.title,
        definition: record.summary,
        ...(tag ? { tag } : {}),
        attachments: original?.attachments ?? [],
      };
    });

  const result = ContentRecordsV2Schema.safeParse({
    schemaVersion: CONTENT_SCHEMA_VERSION_V2,
    pages,
    containers,
    cards,
  });
  if (!result.success) throw new Error('invalid_content_relationships');
  return result.data;
}
