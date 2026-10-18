import type { RepositorySnapshotResponse } from '../lib/content';
import { virtualContainerIdForPage } from '../lib/content-resolution';
import type { ExplorerRecord } from './BackendTree';

export function repositorySnapshotToExplorerRecords(
  snapshot: RepositorySnapshotResponse,
): ExplorerRecord[] {
  if (snapshot.schemaVersion === 2) {
    const pageById = new Map(snapshot.pages.map((page) => [page.id, page]));
    const pages: ExplorerRecord[] = snapshot.pages.map((page) => ({
      id: page.id,
      kind: page.parentId === null ? 'page' : 'subpage',
      title: page.title,
      parentId: page.parentId,
      order: page.order,
      summary: page.description ?? '',
      category: page.parentId
        ? (pageById.get(page.parentId)?.title ?? 'Documentation')
        : 'Documentation',
    }));
    const containers: ExplorerRecord[] = snapshot.containers.map((container) => ({
      id: container.id,
      kind: 'container',
      title: container.title,
      parentId: container.pageId,
      order: container.order,
      summary: `Cards belonging to ${pageById.get(container.pageId)?.title ?? 'this page'}.`,
      category: pageById.get(container.pageId)?.title ?? 'Documentation',
    }));
    const containerById = new Map(
      snapshot.containers.map((container) => [container.id, container]),
    );
    const cards: ExplorerRecord[] = snapshot.cards.map((card) => {
      const container = containerById.get(card.containerId);
      const page = container ? pageById.get(container.pageId) : undefined;
      return {
        id: card.id,
        kind: 'card',
        title: card.title,
        parentId: card.containerId,
        order: card.order,
        summary: card.definition,
        category: page?.title ?? 'Documentation',
        ...(card.tag ? { tag: card.tag } : {}),
        parentTitle: container?.title ?? 'Card Container',
        parentCategory: page?.title ?? 'Documentation',
      };
    });
    return [...pages, ...containers, ...cards];
  }

  const pageById = new Map(snapshot.pages.map((page) => [page.id, page]));
  const containerOrderByPageId = new Map<string, number>();
  for (const child of snapshot.pages) {
    if (child.parentId) {
      containerOrderByPageId.set(
        child.parentId,
        Math.max(containerOrderByPageId.get(child.parentId) ?? 0, child.order + 1),
      );
    }
  }
  const pages: ExplorerRecord[] = snapshot.pages.map((page) => ({
    id: page.id,
    kind: page.parentId === null ? 'page' : 'subpage',
    title: page.title,
    parentId: page.parentId,
    order: page.order,
    summary: page.description ?? '',
    category: page.parentId
      ? (pageById.get(page.parentId)?.title ?? 'Documentation')
      : 'Documentation',
  }));
  const containers: ExplorerRecord[] = snapshot.pages.map((page) => ({
    id: virtualContainerIdForPage(page.id),
    kind: 'container',
    title: 'Cards',
    parentId: page.id,
    order: containerOrderByPageId.get(page.id) ?? 0,
    summary: page.description ?? `Cards belonging to ${page.title}.`,
    category: page.title,
  }));
  const cards: ExplorerRecord[] = snapshot.cards.map((card) => {
    const page = pageById.get(card.pageId);
    const parentId = virtualContainerIdForPage(card.pageId);
    return {
      id: card.id,
      kind: 'card',
      title: card.title,
      parentId,
      order: card.order,
      summary: card.definition,
      category: page?.title ?? 'Documentation',
      ...(card.tag ? { tag: card.tag } : {}),
      parentTitle: 'Cards',
      parentCategory: page?.title ?? 'Documentation',
    };
  });

  return [...pages, ...containers, ...cards];
}

export function defaultExplorerSelection(records: readonly ExplorerRecord[]): string {
  return records.find((record) => record.kind === 'container')?.id ?? records[0]?.id ?? '';
}
