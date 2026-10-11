import type {
  CardRecord,
  PageRecord,
  PublishRequest,
  PublishResponse,
  RepositoryMutation,
  RepositorySnapshotResponse,
} from '@greendocs/contracts';
import {
  assetStoragePath,
  cardStoragePath,
  CardRecordSchema,
  CONTENT_LIMITS,
  ContentRecordsSchema,
  PageRecordSchema,
  pageStoragePath,
  SCHEMA_VERSION,
} from '@greendocs/content-schema';
import { GITHUB_REPOSITORY } from '../../../config';

const { owner: OWNER, name: REPOSITORY, branch: BRANCH } = GITHUB_REPOSITORY;
const REPOSITORY_PATH = `/repos/${OWNER}/${REPOSITORY}`;
const COMMIT_SHA_PATTERN = /^[0-9a-f]{40}$/;
const PAGE_PATH_PATTERN = /^content\/pages\/([0-9a-f-]{36})\.json$/;
const CARD_PATH_PATTERN = /^content\/cards\/([0-9a-f-]{36})\.json$/;
const ASSET_PATH_PATTERN =
  /^content\/media\/([0-9a-f-]{36})\.(?:jpg|png|webp|mp3|ogg|wav|mp4|webm|pdf)$/;

type RequestGithub = (path: string, init?: RequestInit) => Promise<Response>;

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

interface GitHubBlobCreated {
  sha: string;
}

interface GitHubTreeCreated {
  sha: string;
}

interface MutationTreeEntry {
  path: string;
  mode: '100644';
  type: 'blob';
  sha?: string | null;
  content?: string;
}

function failForResponse(response: Response): Error {
  if (response.status === 401) return new Error('github_token_invalid');
  if (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0') {
    return new Error('github_rate_limited');
  }
  if (response.status === 403 || response.status === 404) {
    return new Error('github_permission_denied');
  }
  if (response.status === 429) return new Error('github_rate_limited');
  if (response.status === 409) return new Error('repository_head_changed');
  return new Error('github_request_failed');
}

async function requestJson<T>(
  request: RequestGithub,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await request(path, init);
  if (!response.ok) throw failForResponse(response);
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

function validateAsset(mimeType: string, base64: string): Uint8Array {
  const allowedMimeTypes: readonly string[] = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'video/mp4',
    'video/webm',
    'application/pdf',
  ];
  if (!allowedMimeTypes.includes(mimeType)) throw new Error('unsupported_asset_mime_type');
  const bytes = decodeBase64(base64);
  if (bytes.byteLength === 0 || bytes.byteLength > CONTENT_LIMITS.assetBytes) {
    throw new Error('invalid_asset_size');
  }
  const text = (start: number, end: number) =>
    new TextDecoder('ascii').decode(bytes.subarray(start, end));
  const valid =
    (mimeType === 'image/png' && bytes.subarray(0, 8).join(',') === '137,80,78,71,13,10,26,10') ||
    (mimeType === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
    (mimeType === 'image/webp' && text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP') ||
    (mimeType === 'audio/mpeg' &&
      (text(0, 3) === 'ID3' || (bytes[0] === 0xff && (bytes[1]! & 0xe0) === 0xe0))) ||
    (mimeType === 'audio/ogg' && text(0, 4) === 'OggS') ||
    (mimeType === 'audio/wav' && text(0, 4) === 'RIFF' && text(8, 12) === 'WAVE') ||
    (mimeType === 'video/mp4' && text(4, 8) === 'ftyp') ||
    (mimeType === 'video/webm' && bytes.subarray(0, 4).join(',') === '26,69,223,163') ||
    (mimeType === 'application/pdf' && text(0, 5) === '%PDF-');
  if (!valid) throw new Error('asset_content_does_not_match_mime_type');
  return bytes;
}

function parseContentRecords(pages: PageRecord[], cards: CardRecord[]) {
  const result = ContentRecordsSchema.safeParse({ schemaVersion: SCHEMA_VERSION, pages, cards });
  if (!result.success) throw new Error('invalid_content_relationships');
  return result.data;
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

    const pages: PageRecord[] = [];
    const cards: CardRecord[] = [];
    const assetPaths: string[] = [];
    const records = tree.tree.filter(
      (entry) =>
        entry.type === 'blob' &&
        typeof entry.path === 'string' &&
        (PAGE_PATH_PATTERN.test(entry.path) ||
          CARD_PATH_PATTERN.test(entry.path) ||
          ASSET_PATH_PATTERN.test(entry.path)),
    );
    await mapLimit(records, 8, async (entry) => {
      const path = entry.path!;
      if (ASSET_PATH_PATTERN.test(path)) {
        assetPaths.push(path);
        return;
      }
      if (!entry.sha) throw new Error(`missing_blob_sha:${path}`);
      const blob = await requestJson<GitHubBlob>(
        this.request,
        `${REPOSITORY_PATH}/git/blobs/${entry.sha}`,
      );
      if (blob.encoding !== 'base64' || typeof blob.content !== 'string') {
        throw new Error(`invalid_content_record:${path}`);
      }
      const text = new TextDecoder().decode(decodeBase64(blob.content.replace(/\s/g, '')));
      if (PAGE_PATH_PATTERN.test(path)) {
        const page = parseRecord(text, PageRecordSchema, path);
        if (pageStoragePath(page.id) !== path) throw new Error(`record_path_mismatch:${path}`);
        pages.push(page);
      } else {
        const card = parseRecord(text, CardRecordSchema, path);
        if (`content/cards/${card.id}.json` !== path)
          throw new Error(`record_path_mismatch:${path}`);
        cards.push(card);
      }
    });
    parseContentRecords(pages, cards);
    return {
      sourceCommit,
      pages,
      cards,
      assetPaths: assetPaths.sort(),
      repository: { owner: OWNER, name: REPOSITORY, branch: BRANCH },
    };
  }

  async publish(request: PublishRequest): Promise<PublishResponse> {
    if (!COMMIT_SHA_PATTERN.test(request.expectedHead)) throw new Error('invalid_expected_commit');
    if (!request.message.trim() || request.message.length > 200) {
      throw new Error('invalid_commit_message');
    }
    if (
      !request.mutations.length ||
      request.mutations.length > CONTENT_LIMITS.mutationsPerPublish
    ) {
      throw new Error('invalid_mutation_count');
    }
    const snapshot = await this.readSnapshot();
    if (snapshot.sourceCommit !== request.expectedHead) throw new Error('repository_head_changed');

    const pages = new Map(snapshot.pages.map((page) => [page.id, page]));
    const cards = new Map(snapshot.cards.map((card) => [card.id, card]));
    const assetPaths = new Set(snapshot.assetPaths);
    const entries = new Map<string, MutationTreeEntry>();
    for (const mutation of request.mutations) {
      const entry = await this.mutationEntry(mutation);
      if (entries.has(entry.path)) throw new Error('duplicate_path_in_batch');
      entries.set(entry.path, entry);
      if (mutation.type === 'upsert-page') pages.set(mutation.record.id, mutation.record);
      if (mutation.type === 'delete-page' && !pages.delete(mutation.id)) {
        throw new Error('page_not_found');
      }
      if (mutation.type === 'upsert-card') cards.set(mutation.record.id, mutation.record);
      if (mutation.type === 'delete-card' && !cards.delete(mutation.id)) {
        throw new Error('card_not_found');
      }
      if (mutation.type === 'upsert-asset') {
        assetPaths.add(assetStoragePath(mutation.id, mutation.mimeType));
      }
      if (mutation.type === 'delete-asset') {
        const path = assetStoragePath(mutation.id, mutation.mimeType);
        if (!assetPaths.delete(path)) throw new Error('asset_not_found');
      }
    }

    const content = parseContentRecords([...pages.values()], [...cards.values()]);
    for (const card of content.cards) {
      for (const attachment of card.attachments) {
        if (
          attachment.kind !== 'link' &&
          !assetPaths.has(assetStoragePath(attachment.assetId, attachment.mimeType))
        ) {
          throw new Error(`missing_asset:${attachment.assetId}`);
        }
      }
    }

    const currentHead = await this.getHead();
    if (currentHead !== request.expectedHead) throw new Error('repository_head_changed');
    const parent = await requestJson<GitHubCommit>(
      this.request,
      `${REPOSITORY_PATH}/git/commits/${request.expectedHead}`,
    );
    const baseTree = parent.tree?.sha ?? parent.commit?.tree?.sha;
    if (!baseTree) throw new Error('github_invalid_response');
    const tree = await requestJson<GitHubTreeCreated>(
      this.request,
      `${REPOSITORY_PATH}/git/trees`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_tree: baseTree,
          tree: [...entries.values()],
        }),
      },
    );
    const commit = await requestJson<GitHubCommit>(this.request, `${REPOSITORY_PATH}/git/commits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: request.message.trim(),
        tree: tree.sha,
        parents: [request.expectedHead],
      }),
    });
    if (!commit.sha || !commit.html_url) throw new Error('github_invalid_response');
    const refResponse = await this.request(`${REPOSITORY_PATH}/git/refs/heads/${BRANCH}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sha: commit.sha, force: false }),
    });
    if (refResponse.status === 409 || refResponse.status === 422) {
      throw new Error('repository_head_changed');
    }
    if (!refResponse.ok) throw failForResponse(refResponse);
    return { commitSha: commit.sha, commitUrl: commit.html_url };
  }

  private async mutationEntry(mutation: RepositoryMutation): Promise<MutationTreeEntry> {
    switch (mutation.type) {
      case 'upsert-page': {
        const page = PageRecordSchema.parse(mutation.record);
        return {
          path: pageStoragePath(page.id),
          mode: '100644',
          type: 'blob',
          content: `${JSON.stringify(page, null, 2)}\n`,
        };
      }
      case 'delete-page':
        return {
          path: pageStoragePath(mutation.id),
          mode: '100644',
          type: 'blob',
          sha: null,
        };
      case 'upsert-card': {
        const card = CardRecordSchema.parse(mutation.record);
        return {
          path: `content/cards/${card.id}.json`,
          mode: '100644',
          type: 'blob',
          content: `${JSON.stringify(card, null, 2)}\n`,
        };
      }
      case 'delete-card':
        return {
          path: cardStoragePath(mutation.id),
          mode: '100644',
          type: 'blob',
          sha: null,
        };
      case 'upsert-asset': {
        const bytes = validateAsset(mutation.mimeType, mutation.bytes);
        const blob = await requestJson<GitHubBlobCreated>(
          this.request,
          `${REPOSITORY_PATH}/git/blobs`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')),
              encoding: 'base64',
            }),
          },
        );
        return {
          path: assetStoragePath(mutation.id, mutation.mimeType),
          mode: '100644',
          type: 'blob',
          sha: blob.sha,
        };
      }
      case 'delete-asset':
        return {
          path: assetStoragePath(mutation.id, mutation.mimeType),
          mode: '100644',
          type: 'blob',
          sha: null,
        };
    }
  }
}

export function createGitHubRepositoryClient(request: RequestGithub): GitHubRepositoryClient {
  return new GitHubRepositoryClient(request);
}
