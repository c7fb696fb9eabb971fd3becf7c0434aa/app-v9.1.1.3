import {
  CardRecordSchema,
  cardStoragePath,
  ContentRecordsSchema,
  PageRecordSchema,
  pageStoragePath,
  SCHEMA_VERSION,
  type CardRecord,
  type PageRecord,
  type RepositorySnapshotResponse,
} from '../../lib/content';
import { GITHUB_REPOSITORY } from '../../../config';

const { owner: OWNER, name: REPOSITORY, branch: BRANCH } = GITHUB_REPOSITORY;
const REPOSITORY_PATH = `/repos/${OWNER}/${REPOSITORY}`;
const COMMIT_SHA_PATTERN = /^[0-9a-f]{40}$/;
const PAGE_PATH_PATTERN = /^content\/pages\/([0-9a-f-]{36})\.json$/;
const CARD_PATH_PATTERN = /^content\/cards\/([0-9a-f-]{36})\.json$/;
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
    const records = tree.tree.filter(
      (entry) =>
        entry.type === 'blob' &&
        typeof entry.path === 'string' &&
        (PAGE_PATH_PATTERN.test(entry.path) || CARD_PATH_PATTERN.test(entry.path)),
    );
    await mapLimit(records, 8, async (entry) => {
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
      if (PAGE_PATH_PATTERN.test(path)) {
        const page = parseRecord(text, PageRecordSchema, path);
        if (pageStoragePath(page.id) !== path) throw new Error(`record_path_mismatch:${path}`);
        pages.push(page);
      } else {
        const card = parseRecord(text, CardRecordSchema, path);
        if (cardStoragePath(card.id) !== path) throw new Error(`record_path_mismatch:${path}`);
        cards.push(card);
      }
    });
    parseContentRecords(pages, cards);
    return {
      sourceCommit,
      pages,
      cards,
      repository: { owner: OWNER, name: REPOSITORY, branch: BRANCH },
    };
  }
}

export function createGitHubRepositoryClient(request: RequestGithub): GitHubRepositoryClient {
  return new GitHubRepositoryClient(request);
}
