import { describe, expect, it, vi } from 'vitest';
import { createGitHubRepositoryClient } from './client';

const owner = 'c7fb696fb9eabb971fd3becf7c0434aa';
const repository = 'app-v9.1.1.3';
const commitSha = 'a'.repeat(40);
const treeSha = 'b'.repeat(40);
const pageId = '11111111-1111-4111-8111-111111111111';
const containerId = '22222222-2222-4222-8222-222222222222';
const cardId = '33333333-3333-4333-8333-333333333333';

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

function repositoryRequest(records: { path: string; value: unknown }[]) {
  const request = vi
    .fn<RequestGithub>()
    .mockResolvedValueOnce(jsonResponse({ object: { sha: commitSha } }))
    .mockResolvedValueOnce(jsonResponse({ tree: { sha: treeSha } }))
    .mockResolvedValueOnce(
      jsonResponse({
        tree: records.map(({ path }, index) => ({
          path,
          type: 'blob',
          sha: String(index + 1).repeat(40),
        })),
      }),
    );
  records.forEach(({ value }) => {
    request.mockResolvedValueOnce(
      jsonResponse({
        encoding: 'base64',
        content: btoa(JSON.stringify(value)),
      }),
    );
  });
  return request;
}

describe('GitHub repository client', () => {
  it('loads the bound repository snapshot from GitHub Git Database endpoints', async () => {
    const request = emptyRepositoryRequest();
    const client = createGitHubRepositoryClient(request);

    await expect(client.readSnapshot()).resolves.toEqual({
      schemaVersion: 1,
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

  it('loads and validates persisted v2 pages, containers, and cards', async () => {
    const records = [
      {
        path: `content/pages/${pageId}.json`,
        value: {
          schemaVersion: 2,
          id: pageId,
          title: 'Platform',
          slug: 'platform',
          parentId: null,
          order: 0,
        },
      },
      {
        path: `content/containers/${containerId}.json`,
        value: {
          schemaVersion: 2,
          id: containerId,
          pageId,
          title: 'Getting Started',
          order: 0,
        },
      },
      {
        path: `content/cards/${cardId}.json`,
        value: {
          schemaVersion: 2,
          id: cardId,
          containerId,
          order: 0,
          title: 'Install',
          definition: 'Install the application.',
          attachments: [],
        },
      },
    ];
    const request = repositoryRequest(records);

    await expect(createGitHubRepositoryClient(request).readSnapshot()).resolves.toEqual({
      schemaVersion: 2,
      sourceCommit: commitSha,
      pages: [records[0]!.value],
      containers: [records[1]!.value],
      cards: [records[2]!.value],
      repository: { owner, name: repository, branch: 'main' },
    });
  });

  it('recognizes an empty schema-v2 repository from its manifest', async () => {
    const request = repositoryRequest([
      {
        path: 'content/manifest.json',
        value: { schemaVersion: 2 },
      },
    ]);

    await expect(createGitHubRepositoryClient(request).readSnapshot()).resolves.toMatchObject({
      schemaVersion: 2,
      pages: [],
      containers: [],
      cards: [],
    });
  });

  it('continues to read schema-v1 page and card records', async () => {
    const records = [
      {
        path: `content/pages/${pageId}.json`,
        value: {
          schemaVersion: 1,
          id: pageId,
          title: 'Platform',
          slug: 'platform',
          parentId: null,
          order: 0,
        },
      },
      {
        path: `content/cards/${cardId}.json`,
        value: {
          schemaVersion: 1,
          id: cardId,
          pageId,
          order: 0,
          title: 'Install',
          definition: 'Install the application.',
          attachments: [],
        },
      },
    ];
    const request = repositoryRequest(records);

    await expect(createGitHubRepositoryClient(request).readSnapshot()).resolves.toEqual({
      schemaVersion: 1,
      sourceCommit: commitSha,
      pages: [records[0]!.value],
      cards: [records[1]!.value],
      repository: { owner, name: repository, branch: 'main' },
    });
  });

  it('rejects repositories that mix schema versions', async () => {
    const request = repositoryRequest([
      {
        path: `content/pages/${pageId}.json`,
        value: {
          schemaVersion: 1,
          id: pageId,
          title: 'Platform',
          slug: 'platform',
          parentId: null,
          order: 0,
        },
      },
      {
        path: `content/cards/${cardId}.json`,
        value: {
          schemaVersion: 2,
          id: cardId,
          containerId,
          order: 0,
          title: 'Install',
          definition: 'Install the application.',
          attachments: [],
        },
      },
    ]);

    await expect(createGitHubRepositoryClient(request).readSnapshot()).rejects.toThrow(
      'mixed_content_schema_versions',
    );
  });

  it('rejects a v2 card that references a missing container', async () => {
    const request = repositoryRequest([
      {
        path: `content/cards/${cardId}.json`,
        value: {
          schemaVersion: 2,
          id: cardId,
          containerId,
          order: 0,
          title: 'Install',
          definition: 'Install the application.',
          attachments: [],
        },
      },
    ]);

    await expect(createGitHubRepositoryClient(request).readSnapshot()).rejects.toThrow(
      'invalid_content_relationships',
    );
  });

  it('publishes a validated v2 snapshot as one non-force commit', async () => {
    const newCommitSha = 'c'.repeat(40);
    const newTreeSha = 'd'.repeat(40);
    const blobSha = 'e'.repeat(40);
    const request = vi
      .fn<RequestGithub>()
      .mockResolvedValueOnce(jsonResponse({ object: { sha: commitSha } }))
      .mockResolvedValueOnce(jsonResponse({ tree: { sha: treeSha } }))
      .mockResolvedValueOnce(
        jsonResponse({
          tree: [
            {
              path: `content/cards/${cardId}.json`,
              type: 'blob',
              sha: 'f'.repeat(40),
            },
          ],
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ sha: blobSha }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'f'.repeat(40) }))
      .mockResolvedValueOnce(jsonResponse({ sha: '1'.repeat(40) }))
      .mockResolvedValueOnce(jsonResponse({ sha: newTreeSha }))
      .mockResolvedValueOnce(jsonResponse({ sha: newCommitSha }))
      .mockResolvedValueOnce(jsonResponse({ object: { sha: commitSha } }))
      .mockResolvedValueOnce(
        jsonResponse({ ref: `refs/heads/main`, object: { sha: newCommitSha } }),
      );
    const content = {
      schemaVersion: 2,
      pages: [
        {
          schemaVersion: 2,
          id: pageId,
          title: 'Platform',
          slug: 'platform',
          parentId: null,
          order: 0,
        },
      ],
      containers: [
        {
          schemaVersion: 2,
          id: containerId,
          pageId,
          title: 'Guides',
          order: 0,
        },
      ],
      cards: [],
    };

    await expect(
      createGitHubRepositoryClient(request).publishV2Snapshot(content, commitSha, 'Save docs'),
    ).resolves.toEqual({ commitSha: newCommitSha });

    const calls = request.mock.calls;
    expect(calls.map(([path, init]) => [path, init?.method ?? 'GET'])).toEqual([
      [`/repos/${owner}/${repository}/git/ref/heads/main`, 'GET'],
      [`/repos/${owner}/${repository}/git/commits/${commitSha}`, 'GET'],
      [`/repos/${owner}/${repository}/git/trees/${treeSha}?recursive=1`, 'GET'],
      [`/repos/${owner}/${repository}/git/blobs`, 'POST'],
      [`/repos/${owner}/${repository}/git/blobs`, 'POST'],
      [`/repos/${owner}/${repository}/git/blobs`, 'POST'],
      [`/repos/${owner}/${repository}/git/trees`, 'POST'],
      [`/repos/${owner}/${repository}/git/commits`, 'POST'],
      [`/repos/${owner}/${repository}/git/ref/heads/main`, 'GET'],
      [`/repos/${owner}/${repository}/git/refs/heads/main`, 'PATCH'],
    ]);
    const treeBody = JSON.parse(String(calls[6]?.[1]?.body));
    expect(treeBody.base_tree).toBe(treeSha);
    expect(treeBody.tree).toHaveLength(4);
    expect(treeBody.tree).toContainEqual({
      path: `content/cards/${cardId}.json`,
      mode: '100644',
      type: 'blob',
      sha: null,
    });
    const refBody = JSON.parse(String(calls[9]?.[1]?.body));
    expect(refBody).toEqual({ sha: newCommitSha, force: false });
  });

  it('refuses stale snapshots before creating any repository objects', async () => {
    const request = vi
      .fn<RequestGithub>()
      .mockResolvedValueOnce(jsonResponse({ object: { sha: 'f'.repeat(40) } }));
    const content = { schemaVersion: 2, pages: [], containers: [], cards: [] };

    await expect(
      createGitHubRepositoryClient(request).publishV2Snapshot(content, commitSha),
    ).rejects.toThrow('repository_head_changed');
    expect(request).toHaveBeenCalledOnce();
  });

  it('validates content before making a GitHub request', async () => {
    const request = vi.fn<RequestGithub>();

    await expect(
      createGitHubRepositoryClient(request).publishV2Snapshot(
        { schemaVersion: 2, pages: [], containers: [], cards: [] },
        'invalid',
      ),
    ).rejects.toThrow('repository_expected_head_invalid');
    expect(request).not.toHaveBeenCalled();
  });

  it('does not advance the branch when the head changes during publication', async () => {
    const request = vi
      .fn<RequestGithub>()
      .mockResolvedValueOnce(jsonResponse({ object: { sha: commitSha } }))
      .mockResolvedValueOnce(jsonResponse({ tree: { sha: treeSha } }))
      .mockResolvedValueOnce(jsonResponse({ tree: [] }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'c'.repeat(40) }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'f'.repeat(40) }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'd'.repeat(40) }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'e'.repeat(40) }))
      .mockResolvedValueOnce(jsonResponse({ object: { sha: 'f'.repeat(40) } }));
    const content = {
      schemaVersion: 2,
      pages: [
        {
          schemaVersion: 2,
          id: pageId,
          title: 'Platform',
          slug: 'platform',
          parentId: null,
          order: 0,
        },
      ],
      containers: [],
      cards: [],
    };

    await expect(
      createGitHubRepositoryClient(request).publishV2Snapshot(content, commitSha),
    ).rejects.toThrow('repository_head_changed');
    expect(request.mock.calls.at(-1)?.[0]).toBe(`/repos/${owner}/${repository}/git/ref/heads/main`);
    expect(request.mock.calls.some(([, init]) => init?.method === 'PATCH')).toBe(false);
  });

  it('reports a non-fast-forward ref update as a head conflict', async () => {
    const content = {
      schemaVersion: 2,
      pages: [
        {
          schemaVersion: 2,
          id: pageId,
          title: 'Platform',
          slug: 'platform',
          parentId: null,
          order: 0,
        },
      ],
      containers: [],
      cards: [],
    };
    const request = vi
      .fn<RequestGithub>()
      .mockResolvedValueOnce(jsonResponse({ object: { sha: commitSha } }))
      .mockResolvedValueOnce(jsonResponse({ tree: { sha: treeSha } }))
      .mockResolvedValueOnce(jsonResponse({ tree: [] }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'c'.repeat(40) }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'f'.repeat(40) }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'd'.repeat(40) }))
      .mockResolvedValueOnce(jsonResponse({ sha: 'e'.repeat(40) }))
      .mockResolvedValueOnce(jsonResponse({ object: { sha: commitSha } }))
      .mockResolvedValueOnce(jsonResponse({ message: 'Update is not a fast forward' }, 422));

    await expect(
      createGitHubRepositoryClient(request).publishV2Snapshot(content, commitSha),
    ).rejects.toThrow('repository_head_changed');
    expect(request.mock.calls.at(-1)?.[1]?.method).toBe('PATCH');
  });
});
