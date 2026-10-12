import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { VerifiedGithubUser } from '@greendocs/contracts';
import { GITHUB_API_ORIGIN, GITHUB_REPOSITORY } from '../../../config';
import { reportClientEvent } from '../../lib/observability';

const REPOSITORY_PATH = `/repos/${GITHUB_REPOSITORY.owner}/${GITHUB_REPOSITORY.name}`;
const API_VERSION = '2022-11-28';

interface GithubIdentity {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
}

interface GithubRepository {
  permissions?: {
    push?: boolean;
  };
}

interface AuthState {
  user: VerifiedGithubUser | null;
  isCheckingSession: false;
  loginWithPat: (pat: string) => Promise<void>;
  logout: () => void;
  githubRequest: (path: string, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthState | null>(null);

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401) throw new Error('github_token_invalid');
    if (response.status === 403 || response.status === 404) {
      throw new Error('github_permission_denied');
    }
    if (response.status === 429) throw new Error('github_rate_limited');
    throw new Error('github_request_failed');
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error('github_invalid_response');
  }
}

function verifiedUser(identity: GithubIdentity): VerifiedGithubUser {
  if (
    !Number.isSafeInteger(identity.id) ||
    identity.id <= 0 ||
    typeof identity.login !== 'string' ||
    !identity.login ||
    typeof identity.avatar_url !== 'string'
  ) {
    throw new Error('github_invalid_identity');
  }
  return {
    id: String(identity.id),
    login: identity.login,
    name: typeof identity.name === 'string' ? identity.name : null,
    avatarUrl: identity.avatar_url,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const token = useRef<string | null>(null);
  const [user, setUser] = useState<VerifiedGithubUser | null>(null);

  const clearAuth = useCallback(() => {
    token.current = null;
    setUser(null);
  }, []);

  const githubRequest = useCallback(
    async (path: string, init: RequestInit = {}): Promise<Response> => {
      const activeToken = token.current;
      if (!activeToken) throw new Error('authentication_required');
      let target: URL;
      try {
        target = new URL(path, GITHUB_API_ORIGIN);
      } catch {
        throw new Error('invalid_github_api_path');
      }
      if (
        target.origin !== GITHUB_API_ORIGIN ||
        (target.pathname !== '/user' && !target.pathname.startsWith(`${REPOSITORY_PATH}/`))
      ) {
        throw new Error('invalid_github_api_path');
      }
      let response: Response;
      try {
        const headers = new Headers(init.headers);
        headers.set('Accept', 'application/vnd.github+json');
        headers.set('Authorization', `Bearer ${activeToken}`);
        headers.set('X-GitHub-Api-Version', API_VERSION);
        response = await fetch(target.toString(), {
          ...init,
          headers,
          cache: 'no-store',
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
          redirect: 'error',
        });
      } catch {
        reportClientEvent('github_request_failure', 'home');
        throw new Error('github_unavailable');
      }
      if (response.status === 401) {
        clearAuth();
        reportClientEvent('github_auth_expired', 'home');
      } else if (!response.ok) {
        reportClientEvent('github_request_failure', 'home', { status: response.status });
      }
      return response;
    },
    [clearAuth],
  );

  const loginWithPat = useCallback(async (pat: string) => {
    const candidate = pat.trim();
    if (!candidate) throw new Error('github_token_invalid');
    token.current = null;
    setUser(null);

    const headers = new Headers({
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${candidate}`,
      'X-GitHub-Api-Version': API_VERSION,
    });
    let identityResponse: Response;
    let repositoryResponse: Response;
    try {
      [identityResponse, repositoryResponse] = await Promise.all([
        fetch(`${GITHUB_API_ORIGIN}/user`, {
          headers,
          cache: 'no-store',
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
          redirect: 'error',
        }),
        fetch(`${GITHUB_API_ORIGIN}${REPOSITORY_PATH}`, {
          headers,
          cache: 'no-store',
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
          redirect: 'error',
        }),
      ]);
    } catch {
      throw new Error('github_unavailable');
    }

    const identity = verifiedUser(await parseResponse<GithubIdentity>(identityResponse));
    const repository = await parseResponse<GithubRepository>(repositoryResponse);
    if (repository.permissions?.push !== true) {
      throw new Error('repository_write_denied');
    }
    token.current = candidate;
    setUser(identity);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const value = useMemo<AuthState>(
    () => ({ user, isCheckingSession: false, loginWithPat, logout, githubRequest }),
    [githubRequest, loginWithPat, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
