import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { VerifiedGithubUser } from '../../lib/content';
import { GITHUB_API_ORIGIN, GITHUB_REPOSITORY } from '../../../config';
import { reportClientEvent } from '../../lib/observability';

const REPOSITORY_PATH = `/repos/${GITHUB_REPOSITORY.owner}/${GITHUB_REPOSITORY.name}`;
const API_VERSION = '2022-11-28';
const SESSION_TOKEN_KEY = 'greendocs.github.pat';

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
  isCheckingSession: boolean;
  sessionRestoreError: boolean;
  verifyGitHubPat: (pat: string) => Promise<void>;
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

async function verifyPat(candidate: string): Promise<VerifiedGithubUser> {
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
  return identity;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const token = useRef<string | null>(null);
  const [user, setUser] = useState<VerifiedGithubUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [sessionRestoreError, setSessionRestoreError] = useState(false);

  const clearAuth = useCallback(() => {
    token.current = null;
    setUser(null);
    try {
      window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
    } catch {
      reportClientEvent('github_session_storage_failure', 'home');
    }
  }, []);

  useEffect(() => {
    let active = true;
    let savedToken: string | null;
    try {
      savedToken = window.sessionStorage.getItem(SESSION_TOKEN_KEY);
    } catch {
      reportClientEvent('github_session_storage_failure', 'home');
      setSessionRestoreError(true);
      setIsCheckingSession(false);
      return () => {
        active = false;
      };
    }

    if (!savedToken) {
      setIsCheckingSession(false);
      return () => {
        active = false;
      };
    }

    void verifyPat(savedToken)
      .then((verified) => {
        if (!active) return;
        token.current = savedToken;
        setUser(verified);
        setSessionRestoreError(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        const errorCode = cause instanceof Error ? cause.message : 'github_request_failed';
        if (
          errorCode === 'github_token_invalid' ||
          errorCode === 'github_permission_denied' ||
          errorCode === 'repository_write_denied'
        ) {
          clearAuth();
        } else {
          setSessionRestoreError(true);
          reportClientEvent('github_session_restore_failure', 'home');
        }
      })
      .finally(() => {
        if (active) setIsCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, [clearAuth]);

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

  const verifyGitHubPat = useCallback(async (pat: string) => {
    const candidate = pat.trim();
    if (!candidate) throw new Error('github_token_invalid');
    await verifyPat(candidate);
  }, []);

  const loginWithPat = useCallback(
    async (pat: string) => {
      const candidate = pat.trim();
      if (!candidate) throw new Error('github_token_invalid');
      setSessionRestoreError(false);
      setIsCheckingSession(true);
      try {
        const identity = await verifyPat(candidate);
        try {
          window.sessionStorage.setItem(SESSION_TOKEN_KEY, candidate);
        } catch {
          throw new Error('github_session_storage_unavailable');
        }
        token.current = candidate;
        setUser(identity);
      } finally {
        setIsCheckingSession(false);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      isCheckingSession,
      sessionRestoreError,
      verifyGitHubPat,
      loginWithPat,
      logout,
      githubRequest,
    }),
    [
      githubRequest,
      isCheckingSession,
      loginWithPat,
      logout,
      sessionRestoreError,
      user,
      verifyGitHubPat,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
