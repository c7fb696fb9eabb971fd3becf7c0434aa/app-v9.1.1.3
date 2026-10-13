import { z } from 'zod';

export interface VerifiedGithubUser {
  id: string;
  login: string;
  name: string | null;
  avatarUrl: string;
}

export interface PageRecord {
  schemaVersion: 1;
  id: string;
  title: string;
  slug: string;
  parentId: string | null;
  order: number;
  description?: string | undefined;
}

export type StoredAttachmentKind = 'image' | 'audio' | 'video' | 'pdf';
export type StoredAttachmentMimeType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'audio/mpeg'
  | 'audio/ogg'
  | 'audio/wav'
  | 'video/mp4'
  | 'video/webm'
  | 'application/pdf';

export interface StoredAttachment {
  id: string;
  kind: StoredAttachmentKind;
  label: string;
  assetId: string;
  mimeType: StoredAttachmentMimeType;
  sizeBytes: number;
}

export interface LinkAttachment {
  id: string;
  kind: 'link';
  label: string;
  url: string;
}

export type Attachment = StoredAttachment | LinkAttachment;

export interface CardRecord {
  schemaVersion: 1;
  id: string;
  pageId: string;
  order: number;
  title: string;
  tag?: string | undefined;
  definition: string;
  keyRule?: string | undefined;
  code?: string | undefined;
  spec?: string | undefined;
  attachments: Attachment[];
}

export interface RepositorySnapshotResponse {
  sourceCommit: string;
  pages: PageRecord[];
  cards: CardRecord[];
  repository: {
    owner: string;
    name: string;
    branch: string;
  };
}

export const SCHEMA_VERSION = 1 as const;

export const CONTENT_LIMITS = Object.freeze({
  titleCharacters: 160,
  tagCharacters: 80,
  descriptionCharacters: 2_000,
  definitionCharacters: 10_000,
  keyRuleCharacters: 5_000,
  codeOrSpecCharacters: 20_000,
  attachmentLabelCharacters: 160,
  orderValue: 1_000_000,
  attachmentsPerCard: 20,
  assetBytes: 10 * 1024 * 1024,
});

export const SUPPORTED_ASSET_TYPES = Object.freeze({
  image: Object.freeze(['image/jpeg', 'image/png', 'image/webp'] as const),
  audio: Object.freeze(['audio/mpeg', 'audio/ogg', 'audio/wav'] as const),
  video: Object.freeze(['video/mp4', 'video/webm'] as const),
  pdf: Object.freeze(['application/pdf'] as const),
});

const assetExtensions: Readonly<Record<StoredAttachmentMimeType, string>> = Object.freeze({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'application/pdf': 'pdf',
});

export function assetExtensionForMimeType(mimeType: StoredAttachmentMimeType): string {
  return assetExtensions[mimeType];
}

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

export const PageRecordSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id: StableIdSchema,
  title: z.string().trim().min(1).max(CONTENT_LIMITS.titleCharacters),
  slug: SlugSchema,
  parentId: StableIdSchema.nullable(),
  order: z.number().int().min(0).max(CONTENT_LIMITS.orderValue),
  description: z.string().max(CONTENT_LIMITS.descriptionCharacters).optional(),
});

const LinkAttachmentSchema = z.object({
  id: StableIdSchema,
  kind: z.literal('link'),
  label: z.string().trim().min(1).max(CONTENT_LIMITS.attachmentLabelCharacters),
  url: z.url().refine((value) => ['http:', 'https:'].includes(new URL(value).protocol)),
});

export const AttachmentSchema = z.discriminatedUnion('kind', [
  z.object({
    id: StableIdSchema,
    kind: z.literal('image'),
    label: z.string().trim().min(1).max(CONTENT_LIMITS.attachmentLabelCharacters),
    assetId: StableIdSchema,
    mimeType: z.enum(SUPPORTED_ASSET_TYPES.image),
    sizeBytes: z.number().int().positive().max(CONTENT_LIMITS.assetBytes),
  }),
  z.object({
    id: StableIdSchema,
    kind: z.literal('audio'),
    label: z.string().trim().min(1).max(CONTENT_LIMITS.attachmentLabelCharacters),
    assetId: StableIdSchema,
    mimeType: z.enum(SUPPORTED_ASSET_TYPES.audio),
    sizeBytes: z.number().int().positive().max(CONTENT_LIMITS.assetBytes),
  }),
  z.object({
    id: StableIdSchema,
    kind: z.literal('video'),
    label: z.string().trim().min(1).max(CONTENT_LIMITS.attachmentLabelCharacters),
    assetId: StableIdSchema,
    mimeType: z.enum(SUPPORTED_ASSET_TYPES.video),
    sizeBytes: z.number().int().positive().max(CONTENT_LIMITS.assetBytes),
  }),
  z.object({
    id: StableIdSchema,
    kind: z.literal('pdf'),
    label: z.string().trim().min(1).max(CONTENT_LIMITS.attachmentLabelCharacters),
    assetId: StableIdSchema,
    mimeType: z.enum(SUPPORTED_ASSET_TYPES.pdf),
    sizeBytes: z.number().int().positive().max(CONTENT_LIMITS.assetBytes),
  }),
  LinkAttachmentSchema,
]);

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
