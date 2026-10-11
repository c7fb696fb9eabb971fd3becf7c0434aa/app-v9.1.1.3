import type { Octokit } from '@octokit/rest';
import { describe, expect, it, vi } from 'vitest';
import { SCHEMA_VERSION, type PageRecord } from '@greendocs/content-schema';
import {
  GitHubRepositoryAdapter,
  GitHubRepositoryError,
  RepositoryConflictError,
  RepositoryValidationError,
  type RepositoryBinding,
} from './repository.js';

const binding: RepositoryBinding = {
  owner: 'fixed-owner',
  repository: 'fixed-repo',
  branch: 'main',
};
const headSha = 'a'.repeat(40);
const treeSha = 'b'.repeat(40);
const nextTreeSha = 'c'.repeat(40);
const commitSha = 'd'.repeat(40);
const page: PageRecord = {
  schemaVersion: SCHEMA_VERSION,
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Guide',
  slug: 'guide',
  parentId: null,
  order: 0,
};

function createClient(
  options: { refSha?: string; refStatus?: number; updateStatus?: number } = {},
) {
  const treeEntries: unknown[][] = [];
  const git = {
    getRef: vi.fn(async () => {
      if (options.refStatus !== undefined) throw { status: options.refStatus };
      return { data: { object: { sha: options.refSha ?? headSha } } };
    }),
    getCommit: vi.fn(async () => ({ data: { tree: { sha: treeSha } } })),
    getTree: vi.fn(async () => ({ data: { tree: [] } })),
    getBlob: vi.fn(async () => ({ data: { content: '', encoding: 'base64' } })),
    createBlob: vi.fn(async () => ({ data: { sha: nextTreeSha } })),
    createTree: vi.fn(async (parameters: { tree: unknown[] }) => {
      treeEntries.push(parameters.tree);
      return { data: { sha: nextTreeSha } };
    }),
    createCommit: vi.fn(async () => ({
      data: { sha: commitSha, html_url: 'https://github.com/owner/repo/commit/sha' },
    })),
    updateRef:
      options.updateStatus === undefined
        ? vi.fn(async () => ({ data: {} }))
        : vi.fn(async () => {
            throw { status: options.updateStatus };
          }),
  };
  return {
    client: { rest: { git } } as unknown as Octokit,
    git,
    treeEntries,
  };
}

describe('GitHub repository adapter', () => {
  it('returns the source commit for the validated repository snapshot', async () => {
    const { client } = createClient();
    const adapter = new GitHubRepositoryAdapter(client, binding);

    await expect(adapter.readSnapshot()).resolves.toMatchObject({
      commitSha: headSha,
      treeSha,
      pages: [],
      cards: [],
    });
  });

  it('maps token, missing-repository, and rate-limit failures to explicit safe codes', async () => {
    for (const [status, code] of [
      [401, 'github_token_invalid'],
      [404, 'github_repository_or_content_not_found'],
      [429, 'github_rate_limited'],
    ] as const) {
      const { client } = createClient({ refStatus: status });
      const adapter = new GitHubRepositoryAdapter(client, binding);
      await expect(adapter.readSnapshot()).rejects.toMatchObject({
        code,
        status,
      } satisfies Partial<GitHubRepositoryError>);
    }
  });

  it('commits a validated batch as one tree and advances the fixed ref without force', async () => {
    const { client, git, treeEntries } = createClient();
    const adapter = new GitHubRepositoryAdapter(client, binding);

    const result = await adapter.publishBatch(
      headSha,
      [{ type: 'upsert-page', record: page }],
      'Add guide',
    );

    expect(result).toEqual({
      commitSha,
      commitUrl: 'https://github.com/owner/repo/commit/sha',
    });
    expect(git.getRef).toHaveBeenCalledWith({
      owner: binding.owner,
      repo: binding.repository,
      ref: 'heads/main',
    });
    expect(treeEntries[0]).toEqual([
      {
        path: `content/pages/${page.id}.json`,
        mode: '100644',
        type: 'blob',
        content: `${JSON.stringify(page, null, 2)}\n`,
      },
    ]);
    expect(git.createCommit).toHaveBeenCalledWith({
      owner: binding.owner,
      repo: binding.repository,
      message: 'Add guide',
      tree: nextTreeSha,
      parents: [headSha],
    });
    expect(git.updateRef).toHaveBeenCalledWith({
      owner: binding.owner,
      repo: binding.repository,
      ref: 'heads/main',
      sha: commitSha,
      force: false,
    });
  });

  it('rejects stale drafts before creating Git objects', async () => {
    const { client, git } = createClient({ refSha: 'e'.repeat(40) });
    const adapter = new GitHubRepositoryAdapter(client, binding);

    await expect(
      adapter.publishBatch(headSha, [{ type: 'upsert-page', record: page }], 'Add guide'),
    ).rejects.toBeInstanceOf(RepositoryConflictError);
    expect(git.createTree).not.toHaveBeenCalled();
  });

  it('maps a raced non-force ref update to a conflict', async () => {
    const { client } = createClient({ updateStatus: 422 });
    const adapter = new GitHubRepositoryAdapter(client, binding);

    await expect(
      adapter.publishBatch(headSha, [{ type: 'upsert-page', record: page }], 'Add guide'),
    ).rejects.toBeInstanceOf(RepositoryConflictError);
  });

  it('rejects invalid page batches and fake asset bytes before Git writes', async () => {
    const { client, git } = createClient();
    const adapter = new GitHubRepositoryAdapter(client, binding);

    await expect(
      adapter.publishBatch(
        headSha,
        [{ type: 'upsert-page', record: { ...page, slug: '../escape' } }],
        'Bad page',
      ),
    ).rejects.toBeInstanceOf(RepositoryValidationError);
    await expect(
      adapter.publishBatch(
        headSha,
        [
          {
            type: 'upsert-asset',
            id: page.id,
            mimeType: 'image/png',
            bytes: new Uint8Array([1, 2, 3]),
          },
        ],
        'Fake asset',
      ),
    ).rejects.toBeInstanceOf(RepositoryValidationError);
    expect(git.createTree).not.toHaveBeenCalled();
  });
});
