import {
  cardStoragePath,
  CONTENT_MANIFEST_PATH,
  CONTENT_SCHEMA_VERSION_V2,
  containerStoragePath,
  migrateV1ContentRecords,
  pageStoragePath,
  type RepositoryV1SnapshotResponse,
} from './content';

export interface ContentMigrationFileChange {
  path: string;
  action: 'add' | 'replace';
  content: string;
}

export interface V1ToV2MigrationPlan {
  sourceCommit: string;
  repository: RepositoryV1SnapshotResponse['repository'];
  sourceSchemaVersion: 1;
  targetSchemaVersion: 2;
  containerIdsByPageId: Record<string, string>;
  summary: {
    pages: number;
    containersAdded: number;
    cards: number;
    filesAdded: number;
    filesReplaced: number;
  };
  changes: ContentMigrationFileChange[];
}

const COMMIT_SHA_PATTERN = /^[0-9a-f]{40}$/;

function serializeRecord(record: object): string {
  return `${JSON.stringify(record, null, 2)}\n`;
}

export function createV1ToV2MigrationPlan(
  snapshot: RepositoryV1SnapshotResponse,
  containerIdsByPageId: Readonly<Record<string, string>>,
): V1ToV2MigrationPlan {
  if (snapshot.schemaVersion !== undefined && snapshot.schemaVersion !== 1) {
    throw new Error('migration_source_schema_unsupported');
  }
  if (!COMMIT_SHA_PATTERN.test(snapshot.sourceCommit)) {
    throw new Error('migration_source_commit_invalid');
  }

  const pageIds = snapshot.pages.map((page) => page.id).sort();
  const suppliedPageIds = Object.keys(containerIdsByPageId).sort();
  if (
    pageIds.length !== suppliedPageIds.length ||
    pageIds.some((pageId, index) => pageId !== suppliedPageIds[index])
  ) {
    throw new Error('migration_container_mapping_incomplete');
  }

  let nextContainerIndex = 0;
  const orderedPages = [...snapshot.pages].sort((left, right) => left.id.localeCompare(right.id));
  const orderedCards = [...snapshot.cards].sort((left, right) => left.id.localeCompare(right.id));
  const migrated = migrateV1ContentRecords(
    {
      schemaVersion: 1,
      pages: orderedPages,
      cards: orderedCards,
    },
    () => {
      const page = orderedPages[nextContainerIndex++];
      if (!page) throw new Error('migration_container_mapping_incomplete');
      const containerId = containerIdsByPageId[page.id];
      if (!containerId) throw new Error('migration_container_mapping_incomplete');
      return containerId;
    },
  );

  const changes: ContentMigrationFileChange[] = [
    {
      path: CONTENT_MANIFEST_PATH,
      action: 'add' as const,
      content: serializeRecord({ schemaVersion: CONTENT_SCHEMA_VERSION_V2 }),
    },
    ...migrated.pages.map((page) => ({
      path: pageStoragePath(page.id),
      action: 'replace' as const,
      content: serializeRecord(page),
    })),
    ...migrated.containers.map((container) => ({
      path: containerStoragePath(container.id),
      action: 'add' as const,
      content: serializeRecord(container),
    })),
    ...migrated.cards.map((card) => ({
      path: cardStoragePath(card.id),
      action: 'replace' as const,
      content: serializeRecord(card),
    })),
  ].sort((left, right) => left.path.localeCompare(right.path));

  return {
    sourceCommit: snapshot.sourceCommit,
    repository: snapshot.repository,
    sourceSchemaVersion: 1,
    targetSchemaVersion: 2,
    containerIdsByPageId: Object.fromEntries(
      pageIds.map((pageId) => [pageId, containerIdsByPageId[pageId]!]),
    ),
    summary: {
      pages: migrated.pages.length,
      containersAdded: migrated.containers.length,
      cards: migrated.cards.length,
      filesAdded: migrated.containers.length + 1,
      filesReplaced: migrated.pages.length + migrated.cards.length,
    },
    changes,
  };
}
