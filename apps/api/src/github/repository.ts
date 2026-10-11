import { Octokit } from '@octokit/rest';
import { GITHUB_REQUEST_TIMEOUT_MS } from '@greendocs/contracts/runtime-config';
import {
  assetStoragePath,
  cardStoragePath,
  CardRecordSchema,
  CONTENT_LIMITS,
  ContentRecordsSchema,
  PageRecordSchema,
  pageStoragePath,
  type Attachment,
  type CardRecord,
  type PageRecord,
  SCHEMA_VERSION,
  SUPPORTED_ASSET_TYPES,
} from '@greendocs/content-schema';

export interface RepositoryBinding {
  owner: string;
  repository: string;
  branch: string;
}

export type RepositoryMutation =
  | { type: 'upsert-page'; record: PageRecord }
  | { type: 'delete-page'; id: string }
  | { type: 'upsert-card'; record: CardRecord }
  | { type: 'delete-card'; id: string }
  | { type: 'upsert-asset'; id: string; mimeType: string; bytes: Uint8Array }
  | { type: 'delete-asset'; id: string; mimeType: string };

export interface RepositorySnapshot {
  commitSha: string;
  treeSha: string;
  pages: PageRecord[];
  cards: CardRecord[];
  assetPaths: ReadonlySet<string>;
}

export interface PublishResult {
  commitSha: string;
  commitUrl: string;
}

export class RepositoryConflictError extends Error {
  constructor() {
    super('repository_head_changed');
    this.name = 'RepositoryConflictError';
  }
}

export class RepositoryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RepositoryValidationError';
  }
}

export class GitHubRepositoryError extends Error {
  readonly status: number | undefined;
  readonly code: string;

  constructor(code: string, status?: number, cause?: unknown) {
    super(code, { cause });
    this.name = 'GitHubRepositoryError';
    this.code = code;
    this.status = status;
  }
}

interface StoredChange {
  path: string;
  content?: string;
  bytes?: Uint8Array;
  sha?: string | null;
}

const commitShaPattern = /^[0-9a-f]{40}$/;
const assetExtensionPattern =
  /^content\/media\/([0-9a-f-]{36})\.(?:jpg|png|webp|mp3|ogg|wav|mp4|webm|pdf)$/;
const supportedMimeTypes: ReadonlySet<string> = new Set(
  Object.values(SUPPORTED_ASSET_TYPES).flat(),
);

function errorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('status' in error)) return undefined;
  return typeof error.status === 'number' ? error.status : undefined;
}

function mapGitHubError(error: unknown): GitHubRepositoryError {
  const status = errorStatus(error);
  return new GitHubRepositoryError(
    status === 401
      ? 'github_token_invalid'
      : status === 403
        ? 'github_permission_denied'
        : status === 404
          ? 'github_repository_or_content_not_found'
          : status === 429
            ? 'github_rate_limited'
            : 'github_repository_request_failed',
    status,
    error,
  );
}

function validateAssetBytes(mimeType: string, bytes: Uint8Array): void {
  if (!supportedMimeTypes.has(mimeType)) {
    throw new RepositoryValidationError('unsupported_asset_mime_type');
  }
  if (bytes.byteLength === 0 || bytes.byteLength > CONTENT_LIMITS.assetBytes) {
    throw new RepositoryValidationError('invalid_asset_size');
  }

  const view = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const isPng =
    mimeType === 'image/png' &&
    view.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg =
    mimeType === 'image/jpeg' && view[0] === 0xff && view[1] === 0xd8 && view[2] === 0xff;
  const isWebp =
    mimeType === 'image/webp' &&
    view.toString('ascii', 0, 4) === 'RIFF' &&
    view.toString('ascii', 8, 12) === 'WEBP';
  const isMp3 =
    mimeType === 'audio/mpeg' &&
    (view.toString('ascii', 0, 3) === 'ID3' || (view[0] === 0xff && (view[1]! & 0xe0) === 0xe0));
  const isOgg = mimeType === 'audio/ogg' && view.toString('ascii', 0, 4) === 'OggS';
  const isWav =
    mimeType === 'audio/wav' &&
    view.toString('ascii', 0, 4) === 'RIFF' &&
    view.toString('ascii', 8, 12) === 'WAVE';
  const isMp4 = mimeType === 'video/mp4' && view.toString('ascii', 4, 8) === 'ftyp';
  const isWebm =
    mimeType === 'video/webm' && view.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  const isPdf = mimeType === 'application/pdf' && view.toString('ascii', 0, 5) === '%PDF-';

  if (!(isPng || isJpeg || isWebp || isMp3 || isOgg || isWav || isMp4 || isWebm || isPdf)) {
    throw new RepositoryValidationError('asset_content_does_not_match_mime_type');
  }
}

function parseJson<T>(content: string, parse: (value: unknown) => T, filePath: string): T {
  try {
    return parse(JSON.parse(content));
  } catch {
    throw new RepositoryValidationError(`invalid_content_record:${filePath}`);
  }
}

function parsePageRecord(value: unknown): PageRecord {
  const result = PageRecordSchema.safeParse(value);
  if (!result.success) throw new RepositoryValidationError('invalid_page_record');
  return result.data;
}

function parseCardRecord(value: unknown): CardRecord {
  const result = CardRecordSchema.safeParse(value);
  if (!result.success) throw new RepositoryValidationError('invalid_card_record');
  return result.data;
}

function parseContentRecords(pages: PageRecord[], cards: CardRecord[]) {
  const result = ContentRecordsSchema.safeParse({ schemaVersion: SCHEMA_VERSION, pages, cards });
  if (!result.success) throw new RepositoryValidationError('invalid_content_relationships');
  return result.data;
}

function validatedStoragePath(getPath: () => string): string {
  try {
    return getPath();
  } catch {
    throw new RepositoryValidationError('invalid_record_id_or_asset_type');
  }
}

function isStoredAttachment(
  attachment: Attachment,
): attachment is Exclude<Attachment, { kind: 'link' }> {
  return attachment.kind !== 'link';
}

export class GitHubRepositoryAdapter {
  constructor(
    private readonly octokit: Octokit,
    private readonly binding: RepositoryBinding,
  ) {}

  private repositoryParams() {
    return { owner: this.binding.owner, repo: this.binding.repository };
  }

  async readSnapshot(): Promise<RepositorySnapshot> {
    try {
      const head = await this.octokit.rest.git.getRef({
        ...this.repositoryParams(),
        ref: `heads/${this.binding.branch}`,
      });
      const commitSha = head.data.object.sha;
      const commit = await this.octokit.rest.git.getCommit({
        ...this.repositoryParams(),
        commit_sha: commitSha,
      });
      const tree = await this.octokit.rest.git.getTree({
        ...this.repositoryParams(),
        tree_sha: commit.data.tree.sha,
        recursive: '1',
      });
      if (tree.data.truncated) {
        throw new RepositoryValidationError('repository_tree_exceeds_supported_limit');
      }
      const pages: PageRecord[] = [];
      const cards: CardRecord[] = [];
      const assetPaths = new Set<string>();
      const pagePathPattern = /^content\/pages\/([0-9a-f-]{36})\.json$/;
      const cardPathPattern = /^content\/cards\/([0-9a-f-]{36})\.json$/;

      for (const entry of tree.data.tree) {
        if (entry.type !== 'blob' || !entry.path) continue;
        const isPage = pagePathPattern.test(entry.path);
        const isCard = cardPathPattern.test(entry.path);
        const assetMatch = assetExtensionPattern.exec(entry.path);
        if (!isPage && !isCard && !assetMatch) continue;
        if (!entry.sha) throw new RepositoryValidationError(`missing_blob_sha:${entry.path}`);
        if (assetMatch) {
          assetPaths.add(entry.path);
          continue;
        }

        const blob = await this.octokit.rest.git.getBlob({
          ...this.repositoryParams(),
          file_sha: entry.sha,
        });
        const content = Buffer.from(blob.data.content, 'base64').toString('utf8');
        if (isPage) {
          const record = parseJson(content, parsePageRecord, entry.path);
          if (pageStoragePath(record.id) !== entry.path) {
            throw new RepositoryValidationError(`record_path_mismatch:${entry.path}`);
          }
          pages.push(record);
        } else {
          const record = parseJson(content, parseCardRecord, entry.path);
          if (record.id !== entry.path.slice('content/cards/'.length, -'.json'.length)) {
            throw new RepositoryValidationError(`record_path_mismatch:${entry.path}`);
          }
          cards.push(record);
        }
      }

      const records = parseContentRecords(pages, cards);
      for (const card of records.cards) {
        for (const attachment of card.attachments) {
          if (
            isStoredAttachment(attachment) &&
            !assetPaths.has(
              validatedStoragePath(() => assetStoragePath(attachment.assetId, attachment.mimeType)),
            )
          ) {
            throw new RepositoryValidationError(`missing_asset:${attachment.assetId}`);
          }
        }
      }
      return {
        commitSha,
        treeSha: commit.data.tree.sha,
        pages: records.pages,
        cards: records.cards,
        assetPaths,
      };
    } catch (error) {
      if (error instanceof RepositoryValidationError) throw error;
      throw mapGitHubError(error);
    }
  }

  async publishBatch(
    expectedHead: string,
    mutations: readonly RepositoryMutation[],
    message: string,
  ): Promise<PublishResult> {
    if (!commitShaPattern.test(expectedHead)) {
      throw new RepositoryValidationError('invalid_expected_commit');
    }
    if (mutations.length === 0) throw new RepositoryValidationError('empty_publish_batch');
    if (!message.trim() || message.length > 200) {
      throw new RepositoryValidationError('invalid_commit_message');
    }

    const snapshot = await this.readSnapshot();
    if (snapshot.commitSha !== expectedHead) throw new RepositoryConflictError();

    const pages = new Map(snapshot.pages.map((record) => [record.id, record]));
    const cards = new Map(snapshot.cards.map((record) => [record.id, record]));
    const assetPaths = new Set(snapshot.assetPaths);
    const changes = new Map<string, StoredChange>();

    for (const mutation of mutations) {
      switch (mutation.type) {
        case 'upsert-page': {
          const record = parsePageRecord(mutation.record);
          const filePath = pageStoragePath(record.id);
          if (changes.has(filePath)) throw new RepositoryValidationError('duplicate_path_in_batch');
          pages.set(record.id, record);
          changes.set(filePath, {
            path: filePath,
            content: `${JSON.stringify(record, null, 2)}\n`,
          });
          break;
        }
        case 'delete-page': {
          const filePath = validatedStoragePath(() => pageStoragePath(mutation.id));
          if (changes.has(filePath)) throw new RepositoryValidationError('duplicate_path_in_batch');
          if (!pages.delete(mutation.id)) throw new RepositoryValidationError('page_not_found');
          changes.set(filePath, { path: filePath, sha: null });
          break;
        }
        case 'upsert-card': {
          const record = parseCardRecord(mutation.record);
          const filePath = cardStoragePath(record.id);
          if (changes.has(filePath)) throw new RepositoryValidationError('duplicate_path_in_batch');
          cards.set(record.id, record);
          changes.set(filePath, {
            path: filePath,
            content: `${JSON.stringify(record, null, 2)}\n`,
          });
          break;
        }
        case 'delete-card': {
          const filePath = validatedStoragePath(() => cardStoragePath(mutation.id));
          if (changes.has(filePath)) throw new RepositoryValidationError('duplicate_path_in_batch');
          if (!cards.delete(mutation.id)) throw new RepositoryValidationError('card_not_found');
          changes.set(filePath, { path: filePath, sha: null });
          break;
        }
        case 'upsert-asset': {
          const filePath = validatedStoragePath(() =>
            assetStoragePath(mutation.id, mutation.mimeType),
          );
          validateAssetBytes(mutation.mimeType, mutation.bytes);
          if (changes.has(filePath)) throw new RepositoryValidationError('duplicate_path_in_batch');
          assetPaths.add(filePath);
          changes.set(filePath, { path: filePath, bytes: mutation.bytes });
          break;
        }
        case 'delete-asset': {
          const filePath = validatedStoragePath(() =>
            assetStoragePath(mutation.id, mutation.mimeType),
          );
          if (changes.has(filePath)) throw new RepositoryValidationError('duplicate_path_in_batch');
          if (!assetPaths.delete(filePath)) throw new RepositoryValidationError('asset_not_found');
          changes.set(filePath, { path: filePath, sha: null });
          break;
        }
      }
    }

    const records = parseContentRecords([...pages.values()], [...cards.values()]);
    for (const card of records.cards) {
      for (const attachment of card.attachments) {
        if (
          isStoredAttachment(attachment) &&
          !assetPaths.has(
            validatedStoragePath(() => assetStoragePath(attachment.assetId, attachment.mimeType)),
          )
        ) {
          throw new RepositoryValidationError(`missing_asset:${attachment.assetId}`);
        }
      }
    }

    let commitSha: string;
    let commitUrl: string;
    try {
      const treeEntries = [];
      for (const change of changes.values()) {
        if (change.bytes !== undefined) {
          const blob = await this.octokit.rest.git.createBlob({
            ...this.repositoryParams(),
            content: Buffer.from(change.bytes).toString('base64'),
            encoding: 'base64',
          });
          treeEntries.push({
            path: change.path,
            mode: '100644' as const,
            type: 'blob' as const,
            sha: blob.data.sha,
          });
        } else if (change.content !== undefined) {
          treeEntries.push({
            path: change.path,
            mode: '100644' as const,
            type: 'blob' as const,
            content: change.content,
          });
        } else {
          treeEntries.push({
            path: change.path,
            mode: '100644' as const,
            type: 'blob' as const,
            sha: change.sha ?? null,
          });
        }
      }
      const tree = await this.octokit.rest.git.createTree({
        ...this.repositoryParams(),
        base_tree: snapshot.treeSha,
        tree: treeEntries,
      });
      const commit = await this.octokit.rest.git.createCommit({
        ...this.repositoryParams(),
        message: message.trim(),
        tree: tree.data.sha,
        parents: [snapshot.commitSha],
      });
      commitSha = commit.data.sha;
      commitUrl = commit.data.html_url;
    } catch (error) {
      throw mapGitHubError(error);
    }

    try {
      await this.octokit.rest.git.updateRef({
        ...this.repositoryParams(),
        ref: `heads/${this.binding.branch}`,
        sha: commitSha,
        force: false,
      });
    } catch (error) {
      const status = errorStatus(error);
      if (status === 409 || status === 422) throw new RepositoryConflictError();
      throw mapGitHubError(error);
    }
    return { commitSha, commitUrl };
  }
}

export function createGitHubRepositoryAdapter(token: string, binding: RepositoryBinding) {
  return new GitHubRepositoryAdapter(
    new Octokit({ auth: token, request: { timeout: GITHUB_REQUEST_TIMEOUT_MS } }),
    binding,
  );
}
