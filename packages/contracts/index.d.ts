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
  assetPaths: string[];
  repository: {
    owner: string;
    name: string;
    branch: string;
  };
}

export type RepositoryMutation =
  | { type: 'upsert-page'; record: PageRecord }
  | { type: 'delete-page'; id: string }
  | { type: 'upsert-card'; record: CardRecord }
  | { type: 'delete-card'; id: string }
  | { type: 'upsert-asset'; id: string; mimeType: StoredAttachmentMimeType; bytes: string }
  | { type: 'delete-asset'; id: string; mimeType: StoredAttachmentMimeType };

export interface PublishRequest {
  expectedHead: string;
  message: string;
  mutations: RepositoryMutation[];
}

export interface PublishResponse {
  commitSha: string;
  commitUrl: string;
}
