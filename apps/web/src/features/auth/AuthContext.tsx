import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { API_PATHS } from '@greendocs/contracts/api-paths';
import { CACHE_POLICY } from '@greendocs/contracts/cache-policy';
import type { ApiError, LoginResponse, VerifiedGithubUser } from '@greendocs/contracts';
import { resolveClientApiBaseUrl } from '../../../config';
import { reportClientEvent } from '../../lib/observability';

interface AuthState {
  user: VerifiedGithubUser | null;
  session: string | null;
  isCheckingSession: boolean;
  loginWithPat: (pat: string) => Promise<void>;
  logout: () => Promise<void>;
  apiRequest: (path: string, init?: RequestInit) => Promise<Response>;
}

function isLoginResponse(value: unknown): value is LoginResponse {
  if (!value || typeof value !== 'object') return false;
  const result = value as Partial<LoginResponse>;
  return (
    typeof result.session === 'string' &&
    /^[A-Za-z0-9_-]{43}$/.test(result.session) &&
    typeof result.expiresAt === 'string' &&
    Number.isFinite(Date.parse(result.expiresAt)) &&
    !!result.user &&
    typeof result.user.id === 'string' &&
    typeof result.user.login === 'string' &&
    typeof result.user.avatarUrl === 'string'
  );
}

function isApiError(value: unknown): value is ApiError {
  return (
    !!value && typeof value === 'object' && 'error' in value && typeof value.error === 'string'
  );
}

const AuthContext = createContext<AuthState | null>(null);
const apiBase = resolveClientApiBaseUrl({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<VerifiedGithubUser | null>(null);
  const [session, setSession] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  useEffect(() => {
    if (expiresAt === null) return;
    const timeout = window.setTimeout(
      () => {
        setUser(null);
        setSession(null);
        setExpiresAt(null);
        reportClientEvent('auth_expired', 'studio');
      },
      Math.max(0, expiresAt - Date.now()),
    );
    return () => window.clearTimeout(timeout);
  }, [expiresAt]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      session,
      isCheckingSession: false,
      async loginWithPat(pat) {
        let response: Response;
        try {
          response = await fetch(`${apiBase}${API_PATHS.authLogin}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pat }),
            cache: CACHE_POLICY.authenticatedApi,
          });
        } catch {
          throw new Error('authentication_unavailable');
        }
        let body: unknown;
        try {
          body = (await response.json()) as LoginResponse | ApiError;
        } catch {
          throw new Error('authentication_failed');
        }
        if (!response.ok || !isLoginResponse(body)) {
          throw new Error(isApiError(body) ? body.error : 'authentication_failed');
        }
        setUser(body.user);
        setSession(body.session);
        setExpiresAt(Date.parse(body.expiresAt));
      },
      async logout() {
        const activeSession = session;
        setUser(null);
        setSession(null);
        setExpiresAt(null);
        if (!activeSession) return;
        let response: Response;
        try {
          response = await fetch(`${apiBase}${API_PATHS.authLogout}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${activeSession}` },
            cache: CACHE_POLICY.authenticatedApi,
          });
        } catch {
          throw new Error('logout_unavailable');
        }
        if (!response.ok && response.status !== 401) {
          throw new Error('logout_failed');
        }
      },
      async apiRequest(path, init = {}) {
        if (!session) throw new Error('authentication_required');
        if (
          !path.startsWith(`${API_PATHS.apiPrefix}/`) ||
          path.includes('//') ||
          path.includes('\\') ||
          path.includes('?') ||
          path.includes('#')
        ) {
          throw new Error('invalid_api_path');
        }
        const headers = new Headers(init.headers);
        headers.set('Authorization', `Bearer ${session}`);
        let response: Response;
        try {
          response = await fetch(`${apiBase}${path}`, {
            ...init,
            headers,
            cache: CACHE_POLICY.authenticatedApi,
          });
        } catch {
          reportClientEvent('api_failure', 'studio');
          throw new Error('api_unavailable');
        }
        const requestId = response.headers.get('x-request-id');
        if (response.status === 401) {
          setUser(null);
          setSession(null);
          setExpiresAt(null);
          reportClientEvent('auth_expired', 'studio', requestId ? { requestId } : {});
        } else if (!response.ok) {
          reportClientEvent('api_failure', 'studio', {
            status: response.status,
            ...(requestId ? { requestId } : {}),
          });
        }
        return response;
      },
    }),
    [user, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
