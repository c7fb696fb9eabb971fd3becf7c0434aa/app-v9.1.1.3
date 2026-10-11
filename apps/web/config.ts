import { DEFAULT_API_PORT, DEFAULT_WEB_PORT } from '@greendocs/contracts/runtime-config';

export const APP_ROUTES = {
  home: '/',
  login: '/login',
  studio: '/studio/*',
  studioBase: '/studio',
} as const;

export interface WebEnvironment {
  VITE_API_BASE_URL?: string;
  VITE_PAGES_BASE?: string;
  API_PORT?: string;
  WEB_PORT?: string;
}

export interface WebBuildConfig {
  apiBaseUrl: string;
  apiProxyTarget: string;
  pagesBase: string;
  webPort: number;
}

function validateApiBaseUrl(value: string): string {
  if (!value) return '';
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('VITE_API_BASE_URL must be an absolute HTTP(S) origin');
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error('VITE_API_BASE_URL must be an absolute HTTP(S) origin');
  }
  return url.origin;
}

function validatePagesBase(value: string): string {
  if (!value.startsWith('/') || !value.endsWith('/') || value.includes('\\')) {
    throw new Error('VITE_PAGES_BASE must be an absolute site path ending in /');
  }
  if (value.split('/').some((segment) => segment === '.' || segment === '..')) {
    throw new Error('VITE_PAGES_BASE cannot contain traversal segments');
  }
  return value;
}

export function resolveWebBuildConfig(mode: string, environment: WebEnvironment): WebBuildConfig {
  const apiPort = Number(environment.API_PORT ?? DEFAULT_API_PORT);
  if (!Number.isInteger(apiPort) || apiPort < 1 || apiPort > 65535) {
    throw new Error('API_PORT must be a valid TCP port');
  }
  const webPort = Number(environment.WEB_PORT ?? DEFAULT_WEB_PORT);
  if (!Number.isInteger(webPort) || webPort < 1 || webPort > 65535) {
    throw new Error('WEB_PORT must be a valid TCP port');
  }
  const pagesBase = environment.VITE_PAGES_BASE ?? (mode === 'production' ? '/app-v9.1.1.3/' : '/');
  return {
    apiBaseUrl: validateApiBaseUrl(environment.VITE_API_BASE_URL?.trim() ?? ''),
    apiProxyTarget: `http://127.0.0.1:${apiPort}`,
    pagesBase: validatePagesBase(pagesBase),
    webPort,
  };
}

export function resolveClientApiBaseUrl(environment: WebEnvironment): string {
  return validateApiBaseUrl(environment.VITE_API_BASE_URL?.trim() ?? '');
}
