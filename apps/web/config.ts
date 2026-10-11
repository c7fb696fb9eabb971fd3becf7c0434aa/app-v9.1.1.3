import { DEFAULT_WEB_PORT } from '@greendocs/contracts/runtime-config';

export const APP_ROUTES = {
  home: '/',
  login: '/login',
  studio: '/studio/*',
  studioBase: '/studio',
} as const;

export const GITHUB_API_ORIGIN = 'https://api.github.com';
export const GITHUB_REPOSITORY = {
  owner: 'c7fb696fb9eabb971fd3becf7c0434aa',
  name: 'app-v9.1.1.3',
  branch: 'main',
} as const;

export interface WebEnvironment {
  VITE_PAGES_BASE?: string;
  WEB_PORT?: string;
}

export interface WebBuildConfig {
  pagesBase: string;
  webPort: number;
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
  const webPort = Number(environment.WEB_PORT ?? DEFAULT_WEB_PORT);
  if (!Number.isInteger(webPort) || webPort < 1 || webPort > 65535) {
    throw new Error('WEB_PORT must be a valid TCP port');
  }
  const pagesBase = environment.VITE_PAGES_BASE ?? (mode === 'production' ? '/app-v9.1.1.3/' : '/');
  return {
    pagesBase: validatePagesBase(pagesBase),
    webPort,
  };
}
