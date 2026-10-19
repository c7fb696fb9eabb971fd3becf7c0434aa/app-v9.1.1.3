import type { RepositorySnapshotResponse } from '../lib/content';
import type { ExplorerRecord } from './BackendTree';

export function repositorySnapshotToExplorerRecords(
  snapshot: RepositorySnapshotResponse,
): ExplorerRecord[] {
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
  const containerById = new Map(snapshot.containers.map((container) => [container.id, container]));
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
      ...(card.keyRule !== undefined ? { keyRule: card.keyRule } : {}),
      ...(card.code !== undefined ? { code: card.code } : {}),
      ...(card.spec !== undefined ? { spec: card.spec } : {}),
      attachments: card.attachments,
      parentTitle: container?.title ?? 'Card Container',
      parentCategory: page?.title ?? 'Documentation',
    };
  });
  return [...pages, ...containers, ...cards];
}

export function defaultExplorerSelection(records: readonly ExplorerRecord[]): string {
  return records.find((record) => record.kind === 'container')?.id ?? records[0]?.id ?? '';
}
