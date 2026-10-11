import type {
  Attachment,
  CardRecord,
  PageRecord,
  PublishRequest,
  RepositoryMutation,
  RepositorySnapshotResponse,
  StoredAttachment,
  StoredAttachmentMimeType,
} from '@greendocs/contracts';
import {
  assetExtensionForMimeType,
  CONTENT_LIMITS,
  normalizeSlug,
  SUPPORTED_ASSET_TYPES,
} from '@greendocs/contracts/content-policy';

export { normalizeSlug };

export interface PageNode extends PageRecord {
  children: PageNode[];
}

export interface PageDraft {
  id: string;
  title: string;
  slug: string;
  parentId: string;
  description: string;
}

export interface CardDraft {
  id: string;
  pageId: string;
  title: string;
  tag: string;
  definition: string;
  keyRule: string;
  code: string;
  spec: string;
  attachments: Attachment[];
}

export type AssetMutation = Extract<RepositoryMutation, { type: 'upsert-asset' | 'delete-asset' }>;

export function attachmentType(mimeType: string) {
  for (const [kind, mimeTypes] of Object.entries(SUPPORTED_ASSET_TYPES)) {
    if ((mimeTypes as readonly string[]).includes(mimeType)) {
      return {
        kind: kind as StoredAttachment['kind'],
        mimeType: mimeType as StoredAttachmentMimeType,
      };
    }
  }
  return undefined;
}

export function createPageDraft(parentId: string): PageDraft {
  return {
    id: crypto.randomUUID(),
    title: '',
    slug: '',
    parentId,
    description: '',
  };
}

export function createCardDraft(pageId: string): CardDraft {
  return {
    id: crypto.randomUUID(),
    pageId,
    title: '',
    tag: '',
    definition: '',
    keyRule: '',
    code: '',
    spec: '',
    attachments: [],
  };
}

export function pageRecordFromDraft(draft: PageDraft, pages: readonly PageRecord[]): PageRecord {
  const siblings = pages.filter(
    (page) => page.parentId === (draft.parentId || null) && page.id !== draft.id,
  );
  const existing = pages.find((page) => page.id === draft.id);
  return {
    schemaVersion: 1,
    id: draft.id,
    title: draft.title.trim(),
    slug: draft.slug.trim(),
    parentId: draft.parentId || null,
    order:
      existing?.order ??
      (siblings.length
        ? Math.min(Math.max(...siblings.map((page) => page.order)) + 10, CONTENT_LIMITS.orderValue)
        : 0),
    ...(draft.description.trim() ? { description: draft.description.trim() } : {}),
  };
}

export function cardRecordFromDraft(draft: CardDraft, cards: readonly CardRecord[]): CardRecord {
  const existing = cards.find((card) => card.id === draft.id);
  const siblings = cards.filter((card) => card.pageId === draft.pageId && card.id !== draft.id);
  return {
    schemaVersion: 1,
    id: draft.id,
    pageId: draft.pageId,
    order:
      existing?.order ??
      (siblings.length
        ? Math.min(Math.max(...siblings.map((card) => card.order)) + 10, CONTENT_LIMITS.orderValue)
        : 0),
    title: draft.title.trim(),
    ...(draft.tag.trim() ? { tag: draft.tag.trim() } : {}),
    definition: draft.definition.trim(),
    ...(draft.keyRule.trim() ? { keyRule: draft.keyRule.trim() } : {}),
    ...(draft.code.trim() ? { code: draft.code.trim() } : {}),
    ...(draft.spec.trim() ? { spec: draft.spec.trim() } : {}),
    attachments: draft.attachments,
  };
}

export function buildPageTree(pages: readonly PageRecord[]): PageNode[] {
  const nodes = new Map(pages.map((page) => [page.id, { ...page, children: [] as PageNode[] }]));
  const roots: PageNode[] = [];
  for (const node of nodes.values()) {
    if (node.parentId) nodes.get(node.parentId)?.children.push(node);
    else roots.push(node);
  }
  const sort = (items: PageNode[]) => {
    items.sort((left, right) => left.order - right.order || left.slug.localeCompare(right.slug));
    items.forEach((item) => sort(item.children));
  };
  sort(roots);
  return roots;
}

export function filterPageTree(nodes: readonly PageNode[], query: string): PageNode[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [...nodes];
  const filtered: PageNode[] = [];
  for (const node of nodes) {
    const children = filterPageTree(node.children, normalizedQuery);
    if (
      node.title.toLowerCase().includes(normalizedQuery) ||
      node.slug.toLowerCase().includes(normalizedQuery) ||
      children.length > 0
    ) {
      filtered.push({ ...node, children });
    }
  }
  return filtered;
}

export function collectDescendantIds(pageId: string, pages: readonly PageRecord[]): Set<string> {
  const descendants = new Set([pageId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const page of pages) {
      if (page.parentId && descendants.has(page.parentId) && !descendants.has(page.id)) {
        descendants.add(page.id);
        changed = true;
      }
    }
  }
  return descendants;
}

export function attachmentAssetKey(attachment: StoredAttachment): string {
  return `${attachment.assetId}:${attachment.mimeType}`;
}

function assetPath(id: string, mimeType: StoredAttachmentMimeType): string {
  const extension = assetExtensionForMimeType(mimeType);
  if (!extension) throw new Error(`Unsupported attachment MIME type: ${mimeType}`);
  return `content/media/${id}.${extension}`;
}

export function cleanupUnusedAssets(
  candidates: ReadonlySet<string>,
  cards: readonly CardRecord[],
  baseAssetPaths: readonly string[],
  mutations: readonly AssetMutation[],
): AssetMutation[] {
  const referenced = new Set(
    cards.flatMap((card) =>
      card.attachments.flatMap((attachment) =>
        attachment.kind === 'link' ? [] : [attachmentAssetKey(attachment)],
      ),
    ),
  );
  const mutationByKey = new Map<string, AssetMutation>();
  for (const mutation of mutations) {
    const key = `${mutation.id}:${mutation.mimeType}`;
    if (mutation.type === 'delete-asset' && referenced.has(key)) continue;
    if (mutation.type === 'upsert-asset' && !referenced.has(key)) continue;
    mutationByKey.set(key, mutation);
  }
  for (const key of candidates) {
    if (referenced.has(key)) continue;
    const [id, mimeType] = key.split(':') as [string, StoredAttachmentMimeType];
    const current = mutationByKey.get(key);
    if (current?.type === 'upsert-asset') {
      mutationByKey.delete(key);
      continue;
    }
    if (current?.type === 'delete-asset') continue;
    const path = assetPath(id, mimeType);
    if (path && baseAssetPaths.includes(path)) {
      mutationByKey.set(key, { type: 'delete-asset', id, mimeType });
    }
  }
  return [...mutationByKey.values()];
}

export function validateDraft(
  pages: readonly PageRecord[],
  cards: readonly CardRecord[],
  assetPaths: readonly string[],
  assetMutations: readonly AssetMutation[],
): string[] {
  const issues: string[] = [];
  const pagesById = new Map(pages.map((page) => [page.id, page]));
  const slugs = new Set<string>();
  for (const page of pages) {
    if (!page.title.trim()) issues.push(`Page "${page.slug || page.id}" needs a title.`);
    if (page.title.length > CONTENT_LIMITS.titleCharacters) {
      issues.push(
        `Page "${page.slug || page.id}" title exceeds ${CONTENT_LIMITS.titleCharacters} characters.`,
      );
    }
    if (page.description && page.description.length > CONTENT_LIMITS.descriptionCharacters) {
      issues.push(
        `Page "${page.slug || page.id}" description exceeds ${CONTENT_LIMITS.descriptionCharacters} characters.`,
      );
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.slug)) {
      issues.push(`Page "${page.title || page.id}" needs a valid lowercase slug.`);
    }
    if (page.slug.length > CONTENT_LIMITS.titleCharacters) {
      issues.push(
        `Page "${page.title || page.id}" slug exceeds ${CONTENT_LIMITS.titleCharacters} characters.`,
      );
    }
    const key = `${page.parentId ?? 'root'}:${page.slug}`;
    if (slugs.has(key)) issues.push(`Sibling pages cannot share the slug "${page.slug}".`);
    slugs.add(key);
    if (page.parentId && !pagesById.has(page.parentId)) {
      issues.push(`Page "${page.title}" has a missing parent.`);
    }
    const visited = new Set([page.id]);
    let parentId = page.parentId;
    while (parentId) {
      if (visited.has(parentId)) {
        issues.push(`Page "${page.title}" creates a hierarchy cycle.`);
        break;
      }
      visited.add(parentId);
      parentId = pagesById.get(parentId)?.parentId ?? null;
    }
  }
  const availableAssets = new Set(assetPaths);
  for (const mutation of assetMutations) {
    if (mutation.type === 'upsert-asset')
      availableAssets.add(assetPath(mutation.id, mutation.mimeType));
    else availableAssets.delete(assetPath(mutation.id, mutation.mimeType));
  }
  for (const card of cards) {
    if (!pagesById.has(card.pageId))
      issues.push(`Card "${card.title}" is attached to a missing page.`);
    if (!card.title.trim() || !card.definition.trim()) {
      issues.push(`Card "${card.title || card.id}" needs a title and definition.`);
    }
    if (card.title.length > CONTENT_LIMITS.titleCharacters) {
      issues.push(
        `Card "${card.title || card.id}" title exceeds ${CONTENT_LIMITS.titleCharacters} characters.`,
      );
    }
    if (card.tag && card.tag.length > CONTENT_LIMITS.tagCharacters) {
      issues.push(
        `Card "${card.title || card.id}" tag exceeds ${CONTENT_LIMITS.tagCharacters} characters.`,
      );
    }
    if (card.definition.length > CONTENT_LIMITS.definitionCharacters) {
      issues.push(
        `Card "${card.title || card.id}" definition exceeds ${CONTENT_LIMITS.definitionCharacters} characters.`,
      );
    }
    if (card.keyRule && card.keyRule.length > CONTENT_LIMITS.keyRuleCharacters) {
      issues.push(
        `Card "${card.title || card.id}" key rule exceeds ${CONTENT_LIMITS.keyRuleCharacters} characters.`,
      );
    }
    if (
      (card.code && card.code.length > CONTENT_LIMITS.codeOrSpecCharacters) ||
      (card.spec && card.spec.length > CONTENT_LIMITS.codeOrSpecCharacters)
    ) {
      issues.push(
        `Card "${card.title || card.id}" code or spec exceeds ${CONTENT_LIMITS.codeOrSpecCharacters} characters.`,
      );
    }
    if (card.attachments.length > CONTENT_LIMITS.attachmentsPerCard) {
      issues.push(
        `Card "${card.title || card.id}" has more than ${CONTENT_LIMITS.attachmentsPerCard} attachments.`,
      );
    }
    for (const attachment of card.attachments) {
      if (attachment.label.length > CONTENT_LIMITS.attachmentLabelCharacters) {
        issues.push(
          `Attachment label exceeds ${CONTENT_LIMITS.attachmentLabelCharacters} characters.`,
        );
      }
      if (attachment.kind === 'link') continue;
      const path = assetPath(attachment.assetId, attachment.mimeType);
      if (!availableAssets.has(path)) {
        issues.push(`Attachment "${attachment.label}" is missing its uploaded asset.`);
      }
    }
  }
  return [...new Set(issues)];
}

export function buildPublishRequest(
  base: RepositorySnapshotResponse,
  pages: readonly PageRecord[],
  cards: readonly CardRecord[],
  assetMutations: readonly AssetMutation[],
): PublishRequest | null {
  const mutations: RepositoryMutation[] = [];
  const basePages = new Map(base.pages.map((page) => [page.id, page]));
  const draftPages = new Map(pages.map((page) => [page.id, page]));
  const baseCards = new Map(base.cards.map((card) => [card.id, card]));
  const draftCards = new Map(cards.map((card) => [card.id, card]));

  for (const page of pages) {
    if (JSON.stringify(basePages.get(page.id)) !== JSON.stringify(page)) {
      mutations.push({ type: 'upsert-page', record: page });
    }
  }
  for (const card of cards) {
    if (JSON.stringify(baseCards.get(card.id)) !== JSON.stringify(card)) {
      mutations.push({ type: 'upsert-card', record: card });
    }
  }
  for (const card of base.cards) {
    if (!draftCards.has(card.id)) mutations.push({ type: 'delete-card', id: card.id });
  }
  for (const page of base.pages) {
    if (!draftPages.has(page.id)) mutations.push({ type: 'delete-page', id: page.id });
  }
  mutations.push(...assetMutations);
  if (mutations.length === 0) return null;
  return {
    expectedHead: base.sourceCommit,
    message: 'Update GreenDocs content',
    mutations,
  };
}

export function countMutationKinds(mutations: readonly RepositoryMutation[]): string[] {
  const counts = new Map<string, number>();
  for (const mutation of mutations) {
    const label = mutation.type.replace(/-/g, ' ');
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts].map(([label, count]) => `${count} ${label}${count === 1 ? '' : 's'}`);
}

export function fileBytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}
