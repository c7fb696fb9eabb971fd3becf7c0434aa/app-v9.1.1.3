import { describe, expect, it } from 'vitest';
import { loadApiConfig } from './config.js';

describe('API runtime configuration', () => {
  it('uses validated local defaults and binds the configured repository target', () => {
    const config = loadApiConfig({ NODE_ENV: 'test' });

    expect(config.port).toBe(8787);
    expect(config.webPort).toBe(5173);
    expect(config.allowedOrigins).toEqual(new Set(['http://localhost:5173']));
    expect(config.githubTarget).toEqual({
      owner: 'c7fb696fb9eabb971fd3becf7c0434aa',
      repository: 'app-v9.1.1.3',
      branch: 'main',
    });
  });

  it('derives the default local CORS origin from WEB_PORT', () => {
    const config = loadApiConfig({ WEB_PORT: '9001' });
    expect(config.allowedOrigins).toEqual(new Set(['http://localhost:9001']));
  });

  it('sets a bounded session lifetime and requires managed encryption in production', () => {
    expect(loadApiConfig({ NODE_ENV: 'test' }).sessionTtlSeconds).toBe(900);
    expect(() =>
      loadApiConfig({
        NODE_ENV: 'production',
        WEB_ORIGINS: 'https://docs.example.com',
        GITHUB_OWNER: 'owner',
        GITHUB_REPOSITORY: 'repo',
        GITHUB_BRANCH: 'main',
      }),
    ).toThrow('GOOGLE_CLOUD_PROJECT and SESSION_KMS_KEY_NAME must be configured in production');
    expect(() =>
      loadApiConfig({
        NODE_ENV: 'production',
        WEB_ORIGINS: 'https://docs.example.com',
        GITHUB_OWNER: 'owner',
        GITHUB_REPOSITORY: 'repo',
        GITHUB_BRANCH: 'main',
        GOOGLE_CLOUD_PROJECT: 'project',
        SESSION_KMS_KEY_NAME: 'not-a-key-resource',
      }),
    ).toThrow('AUTH_EDGE_RATE_LIMITING_CONFIGURED must be true in production');
    expect(() =>
      loadApiConfig({
        NODE_ENV: 'production',
        WEB_ORIGINS: 'https://docs.example.com',
        GITHUB_OWNER: 'owner',
        GITHUB_REPOSITORY: 'repo',
        GITHUB_BRANCH: 'main',
        GOOGLE_CLOUD_PROJECT: 'project',
        SESSION_KMS_KEY_NAME: 'projects/other/locations/global/keyRings/green/cryptoKeys/sessions',
        AUTH_EDGE_RATE_LIMITING_CONFIGURED: 'true',
      }),
    ).toThrow('SESSION_KMS_KEY_NAME must belong to GOOGLE_CLOUD_PROJECT');
    expect(() => loadApiConfig({ AUTH_SESSION_TTL_SECONDS: '30' })).toThrow(
      'Invalid API runtime configuration',
    );
  });

  it('rejects invalid ports and production settings without HTTPS origins or repo binding', () => {
    expect(() => loadApiConfig({ API_PORT: '0' })).toThrow('Invalid API runtime configuration');
    expect(() => loadApiConfig({ NODE_ENV: 'production' })).toThrow(
      'WEB_ORIGINS must be configured in production',
    );
    expect(() =>
      loadApiConfig({
        NODE_ENV: 'production',
        WEB_ORIGINS: 'http://docs.example.com',
        GITHUB_OWNER: 'owner',
        GITHUB_REPOSITORY: 'repo',
        GITHUB_BRANCH: 'main',
      }),
    ).toThrow('WEB_ORIGINS must contain origins only; production origins must use HTTPS');
  });
});
