import { z } from 'zod';
import {
  assetExtensionForMimeType,
  CONTENT_LIMITS,
  normalizeSlug,
  SUPPORTED_ASSET_TYPES,
} from '@greendocs/contracts/content-policy';

export { CONTENT_LIMITS, normalizeSlug, SUPPORTED_ASSET_TYPES };

export const SCHEMA_VERSION = 1 as const;

const StableIdSchema = z
  .string()
  .uuid()
  .refine((value) => value === value.toLowerCase(), 'IDs must use lowercase UUIDs');
const SlugSchema = z
  .string()
  .min(1)
  .max(CONTENT_LIMITS.titleCharacters)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase words separated by hyphens');

export function pageStoragePath(id: string): string {
  return `content/pages/${StableIdSchema.parse(id)}.json`;
}

export function cardStoragePath(id: string): string {
  return `content/cards/${StableIdSchema.parse(id)}.json`;
}

export function assetStoragePath(id: string, mimeType: string): string {
  const stableId = StableIdSchema.parse(id);
  const extension = assetExtensionForMimeType(mimeType);
  if (!extension) throw new Error('Unsupported asset MIME type');
  return `content/media/${stableId}.${extension}`;
}

export const PageRecordSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id: StableIdSchema,
  title: z.string().trim().min(1).max(CONTENT_LIMITS.titleCharacters),
  slug: SlugSchema,
  parentId: StableIdSchema.nullable(),
  order: z.number().int().min(0).max(CONTENT_LIMITS.orderValue),
  description: z.string().max(CONTENT_LIMITS.descriptionCharacters).optional(),
});
export type PageRecord = z.infer<typeof PageRecordSchema>;

const ImageAttachmentSchema = z.object({
  id: StableIdSchema,
  kind: z.literal('image'),
  label: z.string().trim().min(1).max(CONTENT_LIMITS.attachmentLabelCharacters),
  assetId: StableIdSchema,
  mimeType: z.enum(SUPPORTED_ASSET_TYPES.image),
  sizeBytes: z.number().int().positive().max(CONTENT_LIMITS.assetBytes),
});
const AudioAttachmentSchema = z.object({
  id: StableIdSchema,
  kind: z.literal('audio'),
  label: z.string().trim().min(1).max(CONTENT_LIMITS.attachmentLabelCharacters),
  assetId: StableIdSchema,
  mimeType: z.enum(SUPPORTED_ASSET_TYPES.audio),
  sizeBytes: z.number().int().positive().max(CONTENT_LIMITS.assetBytes),
});
const VideoAttachmentSchema = z.object({
  id: StableIdSchema,
  kind: z.literal('video'),
  label: z.string().trim().min(1).max(CONTENT_LIMITS.attachmentLabelCharacters),
  assetId: StableIdSchema,
  mimeType: z.enum(SUPPORTED_ASSET_TYPES.video),
  sizeBytes: z.number().int().positive().max(CONTENT_LIMITS.assetBytes),
});
const PdfAttachmentSchema = z.object({
  id: StableIdSchema,
  kind: z.literal('pdf'),
  label: z.string().trim().min(1).max(CONTENT_LIMITS.attachmentLabelCharacters),
  assetId: StableIdSchema,
  mimeType: z.enum(SUPPORTED_ASSET_TYPES.pdf),
  sizeBytes: z.number().int().positive().max(CONTENT_LIMITS.assetBytes),
});
const ExternalLinkAttachmentSchema = z.object({
  id: StableIdSchema,
  kind: z.literal('link'),
  label: z.string().trim().min(1).max(CONTENT_LIMITS.attachmentLabelCharacters),
  url: z.url().refine((value) => ['http:', 'https:'].includes(new URL(value).protocol)),
});

export const AttachmentSchema = z.discriminatedUnion('kind', [
  ImageAttachmentSchema,
  AudioAttachmentSchema,
  VideoAttachmentSchema,
  PdfAttachmentSchema,
  ExternalLinkAttachmentSchema,
]);
export type Attachment = z.infer<typeof AttachmentSchema>;

export const CardRecordSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id: StableIdSchema,
  pageId: StableIdSchema,
  order: z.number().int().min(0).max(CONTENT_LIMITS.orderValue),
  title: z.string().trim().min(1).max(CONTENT_LIMITS.titleCharacters),
  tag: z.string().trim().min(1).max(CONTENT_LIMITS.tagCharacters).optional(),
  definition: z.string().trim().min(1).max(CONTENT_LIMITS.definitionCharacters),
  keyRule: z.string().max(CONTENT_LIMITS.keyRuleCharacters).optional(),
  code: z.string().max(CONTENT_LIMITS.codeOrSpecCharacters).optional(),
  spec: z.string().max(CONTENT_LIMITS.codeOrSpecCharacters).optional(),
  attachments: z.array(AttachmentSchema).max(CONTENT_LIMITS.attachmentsPerCard),
});
export type CardRecord = z.infer<typeof CardRecordSchema>;

export const ContentRecordsSchema = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    pages: z.array(PageRecordSchema),
    cards: z.array(CardRecordSchema),
  })
  .superRefine((records, context) => {
    const pagesById = new Map<string, PageRecord>();
    const seenPageIds = new Set<string>();
    const siblingSlugs = new Set<string>();
    for (const [index, page] of records.pages.entries()) {
      if (seenPageIds.has(page.id)) {
        context.addIssue({
          code: 'custom',
          path: ['pages', index, 'id'],
          message: 'Duplicate page ID',
        });
      }
      seenPageIds.add(page.id);
      pagesById.set(page.id, page);
      const siblingKey = `${page.parentId ?? 'root'}:${page.slug}`;
      if (siblingSlugs.has(siblingKey)) {
        context.addIssue({
          code: 'custom',
          path: ['pages', index, 'slug'],
          message: 'Page slug must be unique among siblings',
        });
      }
      siblingSlugs.add(siblingKey);
    }

    for (const [index, page] of records.pages.entries()) {
      if (page.parentId && !pagesById.has(page.parentId)) {
        context.addIssue({
          code: 'custom',
          path: ['pages', index, 'parentId'],
          message: 'Parent page does not exist',
        });
      }
      const visited = new Set<string>([page.id]);
      let parentId = page.parentId;
      while (parentId) {
        if (visited.has(parentId)) {
          context.addIssue({
            code: 'custom',
            path: ['pages', index, 'parentId'],
            message: 'Page hierarchy cannot contain cycles',
          });
          break;
        }
        visited.add(parentId);
        parentId = pagesById.get(parentId)?.parentId ?? null;
      }
    }

    const seenCardIds = new Set<string>();
    for (const [index, card] of records.cards.entries()) {
      if (seenCardIds.has(card.id)) {
        context.addIssue({
          code: 'custom',
          path: ['cards', index, 'id'],
          message: 'Duplicate card ID',
        });
      }
      seenCardIds.add(card.id);
      if (!pagesById.has(card.pageId)) {
        context.addIssue({
          code: 'custom',
          path: ['cards', index, 'pageId'],
          message: 'Card page does not exist',
        });
      }
      const attachmentIds = new Set<string>();
      for (const [attachmentIndex, attachment] of card.attachments.entries()) {
        if (attachmentIds.has(attachment.id)) {
          context.addIssue({
            code: 'custom',
            path: ['cards', index, 'attachments', attachmentIndex, 'id'],
            message: 'Attachment IDs must be unique within a card',
          });
        }
        attachmentIds.add(attachment.id);
      }
    }
  });
export type ContentRecords = z.infer<typeof ContentRecordsSchema>;

export const ContentIndexSchema = ContentRecordsSchema.safeExtend({
  sourceCommit: z.string().regex(/^[0-9a-f]{40}$/, 'Expected a full Git commit SHA'),
});
export type ContentIndex = z.infer<typeof ContentIndexSchema>;

export function createContentIndex(records: ContentRecords, sourceCommit: string): ContentIndex {
  const validated = ContentRecordsSchema.parse(records);
  const compareRecords = <T extends { id: string; order: number }>(left: T, right: T): number =>
    left.order - right.order || compareStrings(left.id, right.id);

  return ContentIndexSchema.parse({
    ...validated,
    pages: [...validated.pages].sort(
      (left, right) =>
        compareStrings(left.parentId ?? '', right.parentId ?? '') || compareRecords(left, right),
    ),
    cards: [...validated.cards].sort(
      (left, right) => compareStrings(left.pageId, right.pageId) || compareRecords(left, right),
    ),
    sourceCommit,
  });
}

export interface PageTreeNode extends PageRecord {
  children: PageTreeNode[];
}

function compareStrings(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export function buildPageTree(pages: readonly PageRecord[]): PageTreeNode[] {
  const validatedPages = ContentRecordsSchema.parse({
    schemaVersion: SCHEMA_VERSION,
    pages,
    cards: [],
  }).pages;
  const nodes = new Map<string, PageTreeNode>();
  for (const page of validatedPages) nodes.set(page.id, { ...page, children: [] });
  const roots: PageTreeNode[] = [];
  for (const node of nodes.values()) {
    if (node.parentId) nodes.get(node.parentId)?.children.push(node);
    else roots.push(node);
  }
  const sortNodes = (siblings: PageTreeNode[]) => {
    siblings.sort(
      (left, right) =>
        left.order - right.order ||
        compareStrings(left.slug, right.slug) ||
        compareStrings(left.id, right.id),
    );
    for (const sibling of siblings) sortNodes(sibling.children);
  };
  sortNodes(roots);
  return roots;
}
