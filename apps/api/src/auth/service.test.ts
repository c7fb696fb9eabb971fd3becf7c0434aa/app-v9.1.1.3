import { describe, expect, it, vi } from 'vitest';
import type { VerifiedGithubUser } from '@greendocs/contracts';
import { AuthService, AuthenticationError, type GithubIdentityClientFactory } from './service.js';
import type { AuthSessionRecord, AuthSessionStore } from './session-store.js';

const binding = { owner: 'fixed-owner', repository: 'fixed-repo', branch: 'main' };
const sessionId = 's'.repeat(43);
const user: VerifiedGithubUser = {
  id: '12345',
  login: 'verified-user',
  name: 'Verified User',
  avatarUrl: 'https://avatars.example.test/12345',
};

function createStore() {
  const records = new Map<string, AuthSessionRecord>();
  const store: AuthSessionStore = {
    save: vi.fn(async (hash, record) => {
      records.set(hash, record);
    }),
    get: vi.fn(async (hash) => records.get(hash) ?? null),
    delete: vi.fn(async (hash) => {
      records.delete(hash);
    }),
  };
  return { store, records };
}

function githubFactory(
  options: {
    identityError?: unknown;
    permissionError?: unknown;
    canWrite?: boolean;
  } = {},
): GithubIdentityClientFactory {
  return () => ({
    getAuthenticated: async () => {
      if (options.identityError) throw options.identityError;
      return {
        id: Number(user.id),
        login: user.login,
        name: user.name,
        avatarUrl: user.avatarUrl,
      };
    },
    getRepositoryPermissions: async (owner, repository) => {
      expect(owner).toBe(binding.owner);
      expect(repository).toBe(binding.repository);
      if (options.permissionError) throw options.permissionError;
      return { push: options.canWrite ?? true };
    },
  });
}

describe('PAT authentication service', () => {
  it('verifies the actual GitHub user and repository write access before storing a hashed-session record', async () => {
    const { store, records } = createStore();
    const service = new AuthService(
      binding,
      store,
      900,
      githubFactory(),
      () => 1_000_000,
      () => sessionId,
    );

    const result = await service.login('synthetic-test-token');
    expect(result).toEqual({
      session: sessionId,
      user,
      expiresAt: new Date(1_900_000).toISOString(),
    });
    expect(records.size).toBe(1);
    expect([...records.values()][0]).toMatchObject({
      token: 'synthetic-test-token',
      user,
      expiresAt: 1_900_000,
    });
    expect([...records.keys()][0]).not.toBe(sessionId);
  });

  it('rejects invalid tokens and valid users without repository write access', async () => {
    const { store } = createStore();
    const invalidToken = new AuthService(
      binding,
      store,
      900,
      githubFactory({ identityError: { status: 401 } }),
    );
    const readOnlyToken = new AuthService(binding, store, 900, githubFactory({ canWrite: false }));

    await expect(invalidToken.login('synthetic-test-token')).rejects.toMatchObject({
      code: 'github_token_invalid',
      status: 401,
    });
    await expect(readOnlyToken.login('synthetic-test-token')).rejects.toMatchObject({
      code: 'repository_write_denied',
      status: 403,
    });
    expect(store.save).not.toHaveBeenCalled();
  });

  it('expires and revokes sessions without exposing session identifiers to storage keys', async () => {
    const { store } = createStore();
    let now = 5_000;
    const service = new AuthService(
      binding,
      store,
      60,
      githubFactory(),
      () => now,
      () => sessionId,
    );
    await service.login('synthetic-test-token');
    await expect(service.resolve(sessionId)).resolves.toMatchObject({
      user,
      binding,
      expiresAt: 65_000,
    });
    await service.logout(sessionId);
    await expect(service.resolve(sessionId)).resolves.toBeNull();

    await service.login('synthetic-test-token');
    now = 65_000;
    await expect(service.resolve(sessionId)).resolves.toBeNull();
    expect(store.delete).toHaveBeenCalled();
  });

  it('rejects malformed tokens before calling GitHub', async () => {
    const { store } = createStore();
    const factory = vi.fn(githubFactory());
    const service = new AuthService(binding, store, 900, factory);

    await expect(service.login('short')).rejects.toBeInstanceOf(AuthenticationError);
    expect(factory).not.toHaveBeenCalled();
    expect(store.save).not.toHaveBeenCalled();
  });
});
