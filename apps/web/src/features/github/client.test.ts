import { describe, expect, it, vi } from 'vitest';
import { createGitHubRepositoryClient } from './client';

const owner = 'c7fb696fb9eabb971fd3becf7c0434aa';
const repository = 'app-v9.1.1.3';
const commitSha = 'a'.repeat(40);
const treeSha = 'b'.repeat(40);

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function emptyRepositoryRequest() {
  return vi
    .fn<RequestGithub>()
    .mockResolvedValueOnce(jsonResponse({ object: { sha: commitSha } }))
    .mockResolvedValueOnce(jsonResponse({ tree: { sha: treeSha } }))
    .mockResolvedValueOnce(jsonResponse({ tree: [] }));
}

type RequestGithub = (path: string, init?: RequestInit) => Promise<Response>;

describe('GitHub repository client', () => {
  it('loads the bound repository snapshot from GitHub Git Database endpoints', async () => {
    const request = emptyRepositoryRequest();
    const client = createGitHubRepositoryClient(request);

    await expect(client.readSnapshot()).resolves.toEqual({
      sourceCommit: commitSha,
      pages: [],
      cards: [],
      assetPaths: [],
      repository: { owner, name: repository, branch: 'main' },
    });
    expect(request.mock.calls.map(([path]) => path)).toEqual([
      `/repos/${owner}/${repository}/git/ref/heads/main`,
      `/repos/${owner}/${repository}/git/commits/${commitSha}`,
      `/repos/${owner}/${repository}/git/trees/${treeSha}?recursive=1`,
    ]);
  });

  it('publishes one tree and commit, advancing the fixed ref without force', async () => {
    const pageId = '11111111-1111-4111-8111-111111111111';
    const nextCommit = 'c'.repeat(40);
    const request = emptyRepositoryRequest()
      .mockResolvedValueOnce(jsonResponse({ object: { sha: commitSha } }))
      .mockResolvedValueOnce(jsonResponse({ tree: { sha: treeSha } }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'd'.repeat(40) }))
      .mockResolvedValueOnce(
        jsonResponse({ sha: nextCommit, html_url: 'https://github.com/commit' }),
      )
      .mockResolvedValueOnce(jsonResponse({ ref: 'refs/heads/main' }));
    const client = createGitHubRepositoryClient(request);

    await expect(
      client.publish({
        expectedHead: commitSha,
        message: 'Add test page',
        mutations: [
          {
            type: 'upsert-page',
            record: {
              schemaVersion: 1,
              id: pageId,
              title: 'Test',
              slug: 'test',
              parentId: null,
              order: 0,
            },
          },
        ],
      }),
    ).resolves.toEqual({ commitSha: nextCommit, commitUrl: 'https://github.com/commit' });

    const calls = request.mock.calls;
    expect(calls.at(-3)?.[0]).toBe(`/repos/${owner}/${repository}/git/trees`);
    expect(calls.at(-2)?.[0]).toBe(`/repos/${owner}/${repository}/git/commits`);
    expect(calls.at(-1)?.[0]).toBe(`/repos/${owner}/${repository}/git/refs/heads/main`);
    expect(calls.at(-1)?.[1]).toMatchObject({
      method: 'PATCH',
      body: JSON.stringify({ sha: nextCommit, force: false }),
    });
  });

  it('does not create a commit when the expected branch head is stale', async () => {
    const request = vi
      .fn<RequestGithub>()
      .mockResolvedValueOnce(jsonResponse({ object: { sha: 'e'.repeat(40) } }))
      .mockResolvedValueOnce(jsonResponse({ tree: { sha: treeSha } }))
      .mockResolvedValueOnce(jsonResponse({ tree: [] }));
    const client = createGitHubRepositoryClient(request);

    await expect(
      client.publish({
        expectedHead: commitSha,
        message: 'Stale update',
        mutations: [
          {
            type: 'delete-page',
            id: '11111111-1111-4111-8111-111111111111',
          },
        ],
      }),
    ).rejects.toThrow('repository_head_changed');
    expect(request).toHaveBeenCalledTimes(3);
  });
});
