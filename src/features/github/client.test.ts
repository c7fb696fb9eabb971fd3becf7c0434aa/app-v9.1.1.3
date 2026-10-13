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
      repository: { owner, name: repository, branch: 'main' },
    });
    expect(request.mock.calls.map(([path]) => path)).toEqual([
      `/repos/${owner}/${repository}/git/ref/heads/main`,
      `/repos/${owner}/${repository}/git/commits/${commitSha}`,
      `/repos/${owner}/${repository}/git/trees/${treeSha}?recursive=1`,
    ]);
  });
});
