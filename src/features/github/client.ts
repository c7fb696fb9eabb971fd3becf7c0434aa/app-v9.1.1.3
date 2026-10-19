import {
  CardContainerRecordV2Schema,
  CardRecordV2Schema,
  cardStoragePath,
  CONTENT_MANIFEST_PATH,
  ContentManifestV2Schema,
  ContentRecordsV2Schema,
  CONTENT_SCHEMA_VERSION_V2,
  PageRecordV2Schema,
  pageStoragePath,
  mediaStoragePath,
  containerStoragePath,
  type CardContainerRecordV2,
  type CardRecordV2,
  type PageRecordV2,
  type RepositorySnapshotResponse,
  type StoredAttachmentMimeType,
} from '../../lib/content';
import { GITHUB_REPOSITORY } from '../../../config';

const { owner: OWNER, name: REPOSITORY, branch: BRANCH } = GITHUB_REPOSITORY;
const REPOSITORY_PATH = `/repos/${OWNER}/${REPOSITORY}`;
const COMMIT_SHA_PATTERN = /^[0-9a-f]{40}$/;
const PAGE_PATH_PATTERN = /^content\/pages\/([0-9a-f-]{36})\.json$/;
const CARD_PATH_PATTERN = /^content\/cards\/([0-9a-f-]{36})\.json$/;
const CONTAINER_PATH_PATTERN = /^content\/containers\/([0-9a-f-]{36})\.json$/;
type RequestGithub = (path: string, init?: RequestInit) => Promise<Response>;

export interface RepositoryMediaUpload {
  assetId: string;
  mimeType: StoredAttachmentMimeType;
  sizeBytes: number;
  contentBase64: string;
}

interface GitHubTreeEntry {
  path?: string;
  type?: string;
  sha?: string;
}

interface GitHubCommit {
  sha: string;
  html_url?: string;
  tree?: { sha: string };
  commit?: { tree?: { sha: string } };
  object?: { sha: string };
}

interface GitHubTree {
  truncated?: boolean;
  tree?: GitHubTreeEntry[];
}

interface GitHubBlob {
  content?: string;
  encoding?: string;
}

function requestOperation(path: string, method: string): string {
  if (path.includes('/git/blobs')) return method === 'POST' ? 'create-blob' : 'read-blob';
  if (path.includes('/git/trees')) return method === 'POST' ? 'create-tree' : 'read-tree';
  if (path.includes('/git/commits')) return method === 'POST' ? 'create-commit' : 'read-commit';
  if (path.includes('/git/refs/heads/'))
    return method === 'PATCH' ? 'update-branch' : 'read-branch';
  return 'repository-request';
}

function failForResponse(response: Response, path: string, method: string): Error {
  const diagnostic = `: ${requestOperation(path, method)} (HTTP ${response.status})`;
  if (response.status === 401) return new Error(`github_token_invalid${diagnostic}`);
  if (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0') {
    return new Error(`github_rate_limited${diagnostic}`);
  }
  if (response.status === 403 || response.status === 404) {
    return new Error(`github_permission_denied${diagnostic}`);
  }
  if (response.status === 429) return new Error(`github_rate_limited${diagnostic}`);
  if (response.status === 409) return new Error(`repository_head_changed${diagnostic}`);
  if (response.status === 422 && path.includes('/git/refs/heads/')) {
    return new Error(`repository_head_changed${diagnostic}`);
  }
  return new Error(`github_request_failed${diagnostic}`);
}

async function requestJson<T>(
  request: RequestGithub,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await request(path, init);
  if (!response.ok) throw failForResponse(response, path, (init?.method ?? 'GET').toUpperCase());
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error('github_invalid_response');
  }
}

async function mapLimit<T, R>(
  values: readonly T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let next = 0;
  async function worker() {
    while (next < values.length) {
      const index = next++;
      results[index] = await mapper(values[index]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, () => worker()));
  return results;
}

interface SafeParser<T> {
  safeParse(value: unknown): { success: true; data: T } | { success: false; error: unknown };
}

function parseRecord<T>(text: string, schema: SafeParser<T>, expectedPath: string): T {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error(`invalid_content_record:${expectedPath}`);
  }
  const result = schema.safeParse(value);
  if (!result.success || result.data === undefined) {
    throw new Error(`invalid_content_record:${expectedPath}`);
  }
  return result.data;
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function parseContentRecordsV2(
  pages: PageRecordV2[],
  containers: CardContainerRecordV2[],
  cards: CardRecordV2[],
) {
  const result = ContentRecordsV2Schema.safeParse({
    schemaVersion: CONTENT_SCHEMA_VERSION_V2,
    pages,
    containers,
    cards,
  });
  if (!result.success) throw new Error('invalid_content_relationships');
  return result.data;
}

interface GitHubTreeResponse {
  sha?: string;
  tree?: GitHubTreeEntry[];
}

interface GitHubBlobResponse {
  sha?: string;
}

interface GitHubCommitResponse {
  sha?: string;
}

interface GitHubRefResponse {
  object?: { sha?: string };
}

function recordFiles(records: ReturnType<typeof parseContentRecordsV2>) {
  return [
    { path: CONTENT_MANIFEST_PATH, record: { schemaVersion: CONTENT_SCHEMA_VERSION_V2 } },
    ...records.pages.map((record) => ({ path: pageStoragePath(record.id), record })),
    ...records.containers.map((record) => ({
      path: containerStoragePath(record.id),
      record,
    })),
    ...records.cards.map((record) => ({ path: cardStoragePath(record.id), record })),
  ].sort((left, right) => left.path.localeCompare(right.path));
}

function validateMediaUploads(
  records: ReturnType<typeof parseContentRecordsV2>,
  uploads: readonly RepositoryMediaUpload[],
) {
  const references = new Map<string, { mimeType: StoredAttachmentMimeType; sizeBytes: number }>();
  for (const card of records.cards) {
    for (const attachment of card.attachments) {
      if (!('assetId' in attachment)) continue;
      const previous = references.get(attachment.assetId);
      if (
        previous &&
        (previous.mimeType !== attachment.mimeType || previous.sizeBytes !== attachment.sizeBytes)
      ) {
        throw new Error('invalid_media_asset');
      }
      references.set(attachment.assetId, {
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
      });
    }
  }
  const seen = new Set<string>();
  return uploads.map((upload) => {
    const reference = references.get(upload.assetId);
    if (
      !reference ||
      reference.mimeType !== upload.mimeType ||
      reference.sizeBytes !== upload.sizeBytes ||
      seen.has(upload.assetId) ||
      !Number.isInteger(upload.sizeBytes) ||
      upload.sizeBytes < 1 ||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(upload.contentBase64)
    ) {
      throw new Error('invalid_media_asset');
    }
    let byteLength: number;
    try {
      byteLength = atob(upload.contentBase64).length;
    } catch {
      throw new Error('invalid_media_asset');
    }
    if (byteLength !== upload.sizeBytes) throw new Error('invalid_media_asset');
    seen.add(upload.assetId);
    return {
      path: mediaStoragePath(upload.assetId, upload.mimeType),
      content: upload.contentBase64,
      encoding: 'base64' as const,
    };
  });
}

export class GitHubRepositoryClient {
  constructor(private readonly request: RequestGithub) {}

  private async getHead(): Promise<string> {
    const result = await requestJson<GitHubCommit>(
      this.request,
      `${REPOSITORY_PATH}/git/ref/heads/${BRANCH}`,
    );
    const sha = result.object?.sha;
    if (!sha || !COMMIT_SHA_PATTERN.test(sha)) throw new Error('github_invalid_response');
    return sha;
  }

  async readSnapshot(): Promise<RepositorySnapshotResponse> {
    const sourceCommit = await this.getHead();
    const commit = await requestJson<GitHubCommit>(
      this.request,
      `${REPOSITORY_PATH}/git/commits/${sourceCommit}`,
    );
    const treeSha = commit.tree?.sha ?? commit.commit?.tree?.sha;
    if (!treeSha || !COMMIT_SHA_PATTERN.test(treeSha)) throw new Error('github_invalid_response');
    const tree = await requestJson<GitHubTree>(
      this.request,
      `${REPOSITORY_PATH}/git/trees/${treeSha}?recursive=1`,
    );
    if (tree.truncated) throw new Error('repository_tree_exceeds_supported_limit');
    if (!Array.isArray(tree.tree)) throw new Error('github_invalid_response');

    const records = tree.tree.filter(
      (entry) =>
        entry.type === 'blob' &&
        typeof entry.path === 'string' &&
        (PAGE_PATH_PATTERN.test(entry.path) ||
          CARD_PATH_PATTERN.test(entry.path) ||
          CONTAINER_PATH_PATTERN.test(entry.path) ||
          entry.path === CONTENT_MANIFEST_PATH),
    );
    const loaded = await mapLimit(records, 8, async (entry) => {
      const path = entry.path!;
      if (!entry.sha) throw new Error(`missing_blob_sha:${path}`);
      const blob = await requestJson<GitHubBlob>(
        this.request,
        `${REPOSITORY_PATH}/git/blobs/${entry.sha}`,
      );
      if (blob.encoding !== 'base64' || typeof blob.content !== 'string') {
        throw new Error(`invalid_content_record:${path}`);
      }
      const text = new TextDecoder().decode(decodeBase64(blob.content.replace(/\s/g, '')));
      if (path === CONTENT_MANIFEST_PATH) {
        const manifest = parseRecord(text, ContentManifestV2Schema, path);
        return {
          schemaVersion: CONTENT_SCHEMA_VERSION_V2,
          kind: 'manifest',
          record: manifest,
        } as const;
      }
      if (CONTAINER_PATH_PATTERN.test(path)) {
        const container = parseRecord(text, CardContainerRecordV2Schema, path);
        if (containerStoragePath(container.id) !== path) {
          throw new Error(`record_path_mismatch:${path}`);
        }
        return {
          schemaVersion: CONTENT_SCHEMA_VERSION_V2,
          kind: 'container',
          record: container,
        } as const;
      }
      if (PAGE_PATH_PATTERN.test(path)) {
        const value = parseJsonRecord(text, path);
        if (!isSchemaVersionV2(value))
          throw new Error(`unsupported_content_schema_version:${path}`);
        const page = parseValueRecord(value, PageRecordV2Schema, path);
        if (pageStoragePath(page.id) !== path) throw new Error(`record_path_mismatch:${path}`);
        return { schemaVersion: CONTENT_SCHEMA_VERSION_V2, kind: 'page', record: page } as const;
      }
      const value = parseJsonRecord(text, path);
      if (!isSchemaVersionV2(value)) throw new Error(`unsupported_content_schema_version:${path}`);
      const card = parseValueRecord(value, CardRecordV2Schema, path);
      if (cardStoragePath(card.id) !== path) throw new Error(`record_path_mismatch:${path}`);
      return { schemaVersion: CONTENT_SCHEMA_VERSION_V2, kind: 'card', record: card } as const;
    });

    const pagesV2: PageRecordV2[] = [];
    const containersV2: CardContainerRecordV2[] = [];
    const cardsV2: CardRecordV2[] = [];
    for (const entry of loaded) {
      if (entry.kind === 'page') pagesV2.push(entry.record);
      else if (entry.kind === 'container') containersV2.push(entry.record);
      else if (entry.kind === 'card') cardsV2.push(entry.record);
    }

    const hasContentRecords = loaded.length > 0;
    if (hasContentRecords && !loaded.some((entry) => entry.kind === 'manifest')) {
      throw new Error('content_manifest_missing');
    }
    parseContentRecordsV2(pagesV2, containersV2, cardsV2);
    return {
      schemaVersion: CONTENT_SCHEMA_VERSION_V2,
      sourceCommit,
      pages: pagesV2,
      containers: containersV2,
      cards: cardsV2,
      repository: { owner: OWNER, name: REPOSITORY, branch: BRANCH },
    };
  }

  async publishV2Snapshot(
    value: unknown,
    expectedHead: string,
    message = 'Update documentation content',
    mediaUploads: readonly RepositoryMediaUpload[] = [],
  ): Promise<{ commitSha: string }> {
    if (!COMMIT_SHA_PATTERN.test(expectedHead)) throw new Error('repository_expected_head_invalid');
    if (!message.trim() || message.length > 200)
      throw new Error('repository_commit_message_invalid');

    const parsed = ContentRecordsV2Schema.safeParse(value);
    if (!parsed.success) throw new Error('invalid_content_relationships');
    const records = recordFiles(parsed.data);
    const mediaFiles = validateMediaUploads(parsed.data, mediaUploads);
    if ((await this.getHead()) !== expectedHead) throw new Error('repository_head_changed');

    const parent = await requestJson<GitHubCommit>(
      this.request,
      `${REPOSITORY_PATH}/git/commits/${expectedHead}`,
    );
    const baseTreeSha = parent.tree?.sha ?? parent.commit?.tree?.sha;
    if (!baseTreeSha || !COMMIT_SHA_PATTERN.test(baseTreeSha)) {
      throw new Error('github_invalid_response');
    }
    const baseTree = await requestJson<GitHubTree>(
      this.request,
      `${REPOSITORY_PATH}/git/trees/${baseTreeSha}?recursive=1`,
    );
    if (baseTree.truncated) throw new Error('repository_tree_exceeds_supported_limit');
    if (!Array.isArray(baseTree.tree)) throw new Error('github_invalid_response');

    const desiredPaths = new Set(records.map((entry) => entry.path));
    const removedPaths = baseTree.tree
      .filter(
        (entry) =>
          entry.type === 'blob' &&
          typeof entry.path === 'string' &&
          (PAGE_PATH_PATTERN.test(entry.path) ||
            CARD_PATH_PATTERN.test(entry.path) ||
            CONTAINER_PATH_PATTERN.test(entry.path)) &&
          !desiredPaths.has(entry.path),
      )
      .map((entry) => entry.path!);
    const recordBlobs = await mapLimit(records, 8, async ({ path, record }) => {
      const result = await requestJson<GitHubBlobResponse>(
        this.request,
        `${REPOSITORY_PATH}/git/blobs`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: JSON.stringify(record, null, 2) + '\n',
            encoding: 'utf-8',
          }),
        },
      );
      if (!result.sha || !COMMIT_SHA_PATTERN.test(result.sha)) {
        throw new Error(`github_invalid_response:${path}`);
      }
      return { path, mode: '100644', type: 'blob', sha: result.sha };
    });
    const uploadedBlobs = await mapLimit(mediaFiles, 4, async ({ path, content, encoding }) => {
      const result = await requestJson<GitHubBlobResponse>(
        this.request,
        `${REPOSITORY_PATH}/git/blobs`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, encoding }),
        },
      );
      if (!result.sha || !COMMIT_SHA_PATTERN.test(result.sha)) {
        throw new Error(`github_invalid_response:${path}`);
      }
      return { path, mode: '100644', type: 'blob', sha: result.sha };
    });
    const treeEntries = [
      ...recordBlobs,
      ...uploadedBlobs,
      ...removedPaths.map((path) => ({
        path,
        mode: '100644',
        type: 'blob',
        sha: null,
      })),
    ];
    const tree = await requestJson<GitHubTreeResponse>(
      this.request,
      `${REPOSITORY_PATH}/git/trees`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base_tree: baseTreeSha, tree: treeEntries }),
      },
    );
    if (!tree.sha || !COMMIT_SHA_PATTERN.test(tree.sha)) {
      throw new Error('github_invalid_response');
    }
    const commit = await requestJson<GitHubCommitResponse>(
      this.request,
      `${REPOSITORY_PATH}/git/commits`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          tree: tree.sha,
          parents: [expectedHead],
        }),
      },
    );
    if (!commit.sha || !COMMIT_SHA_PATTERN.test(commit.sha)) {
      throw new Error('github_invalid_response');
    }
    if ((await this.getHead()) !== expectedHead) throw new Error('repository_head_changed');

    const updatedRef = await requestJson<GitHubRefResponse>(
      this.request,
      `${REPOSITORY_PATH}/git/refs/heads/${BRANCH}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sha: commit.sha, force: false }),
      },
    );
    if (updatedRef.object?.sha !== commit.sha) throw new Error('github_invalid_response');
    return { commitSha: commit.sha };
  }
}

function parseJsonRecord(text: string, expectedPath: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`invalid_content_record:${expectedPath}`);
  }
}

function isSchemaVersionV2(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'schemaVersion' in value &&
    value.schemaVersion === CONTENT_SCHEMA_VERSION_V2
  );
}

function parseValueRecord<T>(value: unknown, schema: SafeParser<T>, expectedPath: string): T {
  const result = schema.safeParse(value);
  if (!result.success || result.data === undefined) {
    throw new Error(`invalid_content_record:${expectedPath}`);
  }
  return result.data;
}

export function createGitHubRepositoryClient(request: RequestGithub): GitHubRepositoryClient {
  return new GitHubRepositoryClient(request);
}
