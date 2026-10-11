import { createHash, randomBytes } from 'node:crypto';
import { Octokit } from '@octokit/rest';
import { GITHUB_REQUEST_TIMEOUT_MS } from '@greendocs/contracts/runtime-config';
import type { LoginResponse, VerifiedGithubUser } from '@greendocs/contracts';
import type { RepositoryBinding } from '../github/repository.js';
import type { AuthSessionRecord, AuthSessionStore } from './session-store.js';

const sessionIdPattern = /^[A-Za-z0-9_-]{43}$/;

interface GithubIdentityClient {
  getAuthenticated(): Promise<{
    id: number;
    login: string;
    name: string | null;
    avatarUrl: string;
  }>;
  getRepositoryPermissions(owner: string, repository: string): Promise<{ push: boolean }>;
}

export type GithubIdentityClientFactory = (token: string) => GithubIdentityClient;

export class AuthenticationError extends Error {
  constructor(
    readonly code: string,
    readonly status: 400 | 401 | 403 | 503,
  ) {
    super(code);
    this.name = 'AuthenticationError';
  }
}

export interface ResolvedAuthSession extends AuthSessionRecord {
  binding: RepositoryBinding;
}

function errorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('status' in error)) return undefined;
  return typeof error.status === 'number' ? error.status : undefined;
}

function isRateLimited(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('response' in error)) return false;
  const response = error.response;
  if (typeof response !== 'object' || response === null || !('headers' in response)) return false;
  const headers = response.headers;
  return (
    typeof headers === 'object' &&
    headers !== null &&
    'x-ratelimit-remaining' in headers &&
    headers['x-ratelimit-remaining'] === '0'
  );
}

function createGithubIdentityClient(token: string): GithubIdentityClient {
  const octokit = new Octokit({
    auth: token,
    request: { timeout: GITHUB_REQUEST_TIMEOUT_MS },
  });
  return {
    async getAuthenticated() {
      const response = await octokit.rest.users.getAuthenticated();
      return {
        id: response.data.id,
        login: response.data.login,
        name: response.data.name,
        avatarUrl: response.data.avatar_url,
      };
    },
    async getRepositoryPermissions(owner, repository) {
      const response = await octokit.rest.repos.get({ owner, repo: repository });
      return { push: response.data.permissions?.push === true };
    },
  };
}

export class AuthService {
  constructor(
    private readonly binding: RepositoryBinding,
    private readonly sessions: AuthSessionStore,
    private readonly sessionTtlSeconds: number,
    private readonly createGithubClient: GithubIdentityClientFactory = createGithubIdentityClient,
    private readonly now: () => number = Date.now,
    private readonly createSessionId: () => string = () => randomBytes(32).toString('base64url'),
  ) {}

  async login(token: string): Promise<LoginResponse> {
    const normalizedToken = token.trim();
    if (normalizedToken.length < 10 || normalizedToken.length > 512) {
      throw new AuthenticationError('invalid_login_request', 400);
    }

    const github = this.createGithubClient(normalizedToken);
    let user: VerifiedGithubUser;
    try {
      const identity = await github.getAuthenticated();
      user = {
        id: String(identity.id),
        login: identity.login,
        name: identity.name,
        avatarUrl: identity.avatarUrl,
      };
    } catch (error) {
      if (errorStatus(error) === 401) {
        throw new AuthenticationError('github_token_invalid', 401);
      }
      if (isRateLimited(error)) {
        throw new AuthenticationError('github_rate_limited', 503);
      }
      throw new AuthenticationError('github_verification_failed', 503);
    }

    try {
      const permission = await github.getRepositoryPermissions(
        this.binding.owner,
        this.binding.repository,
      );
      if (!permission.push) {
        throw new AuthenticationError('repository_write_denied', 403);
      }
    } catch (error) {
      if (error instanceof AuthenticationError) throw error;
      const status = errorStatus(error);
      if (isRateLimited(error)) {
        throw new AuthenticationError('github_rate_limited', 503);
      }
      if (status === 401) {
        throw new AuthenticationError('github_token_invalid', 401);
      }
      if (status === 403 || status === 404) {
        throw new AuthenticationError('repository_write_denied', 403);
      }
      throw new AuthenticationError('github_verification_failed', 503);
    }

    const sessionId = this.createSessionId();
    if (!sessionIdPattern.test(sessionId)) {
      throw new Error('session_id_generator_returned_invalid_value');
    }
    const expiresAt = this.now() + this.sessionTtlSeconds * 1000;
    const sessionHash = this.hashSessionId(sessionId);
    await this.sessions.save(sessionHash, {
      token: normalizedToken,
      user,
      expiresAt,
    });

    return {
      session: sessionId,
      user,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  async resolve(sessionId: string | null): Promise<ResolvedAuthSession | null> {
    if (!sessionId || !sessionIdPattern.test(sessionId)) return null;
    const session = await this.sessions.get(this.hashSessionId(sessionId));
    if (!session) return null;
    if (this.now() >= session.expiresAt) {
      await this.sessions.delete(this.hashSessionId(sessionId));
      return null;
    }
    return { ...session, binding: this.binding };
  }

  async logout(sessionId: string | null): Promise<void> {
    if (!sessionId || !sessionIdPattern.test(sessionId)) return;
    await this.sessions.delete(this.hashSessionId(sessionId));
  }

  private hashSessionId(sessionId: string): string {
    return createHash('sha256').update(sessionId).digest('hex');
  }
}
