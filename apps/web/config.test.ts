import { describe, expect, it } from 'vitest';
import { resolveClientApiBaseUrl, resolveWebBuildConfig } from './config';

describe('web configuration', () => {
  it('uses the Pages base path and a proxy derived from the API port', () => {
    expect(resolveWebBuildConfig('production', {})).toEqual({
      apiBaseUrl: '',
      apiProxyTarget: 'http://127.0.0.1:8787',
      pagesBase: '/app-v9.1.1.3/',
      webPort: 5173,
    });
    expect(resolveWebBuildConfig('development', { API_PORT: '9000' }).apiProxyTarget).toBe(
      'http://127.0.0.1:9000',
    );
  });

  it('validates public origins and Pages paths', () => {
    expect(resolveClientApiBaseUrl({ VITE_API_BASE_URL: 'https://api.example.com' })).toBe(
      'https://api.example.com',
    );
    expect(() => resolveClientApiBaseUrl({ VITE_API_BASE_URL: 'javascript:alert(1)' })).toThrow(
      'VITE_API_BASE_URL must be an absolute HTTP(S) origin',
    );
    expect(() => resolveWebBuildConfig('production', { VITE_PAGES_BASE: '/../' })).toThrow(
      'VITE_PAGES_BASE cannot contain traversal segments',
    );
    expect(() => resolveWebBuildConfig('development', { API_PORT: '70000' })).toThrow(
      'API_PORT must be a valid TCP port',
    );
  });
});
