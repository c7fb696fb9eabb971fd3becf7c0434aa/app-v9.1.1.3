import { describe, expect, it, vi } from 'vitest';
import { API_PATHS } from '@greendocs/contracts/api-paths';
import { app, createApp } from './app.js';
import { AuthService } from './auth/service.js';
import { apiConfig } from './config.js';
import type { PublishIdempotencyStore } from './github/idempotency.js';
import type { AuthSessionRecord, AuthSessionStore } from './auth/session-store.js';

const sessionId = 's'.repeat(43);

function createAuthService() {
  const records = new Map<string, AuthSessionRecord>();
  const sessions: AuthSessionStore = {
    async save(hash, record) {
      records.set(hash, record);
    },
    async get(hash) {
      return records.get(hash) ?? null;
    },
    async delete(hash) {
      records.delete(hash);
    },
  };
  return new AuthService(
    { owner: 'owner', repository: 'repo', branch: 'main' },
    sessions,
    900,
    () => ({
      async getAuthenticated() {
        return {
          id: 123,
          login: 'verified-user',
          name: null,
          avatarUrl: 'https://avatars.example.test/123',
        };
      },
      async getRepositoryPermissions(owner, repository) {
        expect(owner).toBe('owner');
        expect(repository).toBe('repo');
        return { push: true };
      },
    }),
    () => 1_000_000,
    () => sessionId,
  );
}

describe('API', () => {
  it('provides a health response', async () => {
    const response = await app.request('/healthz');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok', service: 'greendocs-api' });
  });

  it('fails closed when managed PAT authentication is not configured', async () => {
    const response = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pat: 'synthetic-test-only' }),
    });
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: 'auth_provider_not_configured',
    });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('returns only a verified identity, and enforces session expiry/revocation on protected API routes', async () => {
    const app = createApp({ authService: createAuthService() });
    const login = await app.request(API_PATHS.authLogin, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pat: 'synthetic-test-token' }),
    });

    expect(login.status).toBe(200);
    expect(await login.json()).toMatchObject({
      session: sessionId,
      user: { id: '123', login: 'verified-user' },
      expiresAt: new Date(1_900_000).toISOString(),
    });
    const authorization = { Authorization: `Bearer ${sessionId}` };
    const identity = await app.request(API_PATHS.authMe, { headers: authorization });
    expect(identity.status).toBe(200);
    expect(await identity.json()).toMatchObject({
      user: { id: '123', login: 'verified-user' },
    });

    const logout = await app.request(API_PATHS.authLogout, {
      method: 'POST',
      headers: authorization,
    });
    expect(logout.status).toBe(204);
    const afterLogout = await app.request(API_PATHS.authMe, { headers: authorization });
    expect(afterLogout.status).toBe(401);
  });

  it('replays a completed publish idempotency key without creating another commit', async () => {
    const authService = createAuthService();
    const result = {
      commitSha: 'a'.repeat(40),
      commitUrl: 'https://github.com/owner/repo/commit/example',
    };
    const idempotencyStore: PublishIdempotencyStore = {
      async reserve() {
        return { kind: 'replay', result };
      },
      async complete() {
        throw new Error('replay_must_not_complete');
      },
      async release() {
        throw new Error('replay_must_not_release');
      },
    };
    const app = createApp({
      authService,
      publishIdempotencyStore: idempotencyStore,
    });
    await authService.login('synthetic-test-token');

    const response = await app.request(API_PATHS.repositoryPublish, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionId}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': '550e8400-e29b-41d4-a716-446655440000',
      },
      body: JSON.stringify({
        expectedHead: 'b'.repeat(40),
        message: 'Publish guide',
        mutations: [
          {
            type: 'upsert-page',
            record: {
              schemaVersion: 1,
              id: '550e8400-e29b-41d4-a716-446655440001',
              title: 'Guide',
              slug: 'guide',
              parentId: null,
              order: 0,
            },
          },
        ],
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('idempotent-replay')).toBe('true');
    expect(await response.json()).toEqual(result);
  });

  it('publishes a validated batch through the fixed server repository binding', async () => {
    const authService = createAuthService();
    await authService.login('synthetic-test-token');
    const result = {
      commitSha: 'c'.repeat(40),
      commitUrl: 'https://github.com/owner/repo/commit/example',
    };
    const publishBatch = vi.fn(async () => result);
    const repositoryAdapterFactory = vi.fn(() => ({
      async readSnapshot() {
        return {
          commitSha: 'b'.repeat(40),
          treeSha: 'd'.repeat(40),
          pages: [],
          cards: [],
          assetPaths: new Set<string>(),
        };
      },
      publishBatch,
    }));
    const idempotencyStore: PublishIdempotencyStore = {
      async reserve() {
        return { kind: 'acquired' };
      },
      async complete() {},
      async release() {},
    };
    const app = createApp({
      authService,
      repositoryAdapterFactory,
      publishIdempotencyStore: idempotencyStore,
    });
    const response = await app.request(API_PATHS.repositoryPublish, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionId}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': '550e8400-e29b-41d4-a716-446655440000',
      },
      body: JSON.stringify({
        expectedHead: 'b'.repeat(40),
        message: 'Publish guide',
        mutations: [
          {
            type: 'upsert-page',
            record: {
              schemaVersion: 1,
              id: '550e8400-e29b-41d4-a716-446655440001',
              title: 'Guide',
              slug: 'guide',
              parentId: null,
              order: 0,
            },
          },
        ],
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-request-id')).toBeTruthy();
    expect(repositoryAdapterFactory).toHaveBeenCalledWith(
      'synthetic-test-token',
      apiConfig.githubTarget,
    );
    expect(publishBatch).toHaveBeenCalledWith(
      'b'.repeat(40),
      [
        {
          type: 'upsert-page',
          record: {
            schemaVersion: 1,
            id: '550e8400-e29b-41d4-a716-446655440001',
            title: 'Guide',
            slug: 'guide',
            parentId: null,
            order: 0,
          },
        },
      ],
      'Publish guide',
    );
    expect(await response.json()).toEqual(result);
  });
});
