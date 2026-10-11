import { describe, expect, it } from 'vitest';
import { resolveWebBuildConfig } from './config';

describe('web configuration', () => {
  it('uses the Pages base path and local web port', () => {
    expect(resolveWebBuildConfig('production', {})).toEqual({
      pagesBase: '/app-v9.1.1.3/',
      webPort: 5173,
    });
  });

  it('validates Pages paths and the local web port', () => {
    expect(() => resolveWebBuildConfig('production', { VITE_PAGES_BASE: '/../' })).toThrow(
      'VITE_PAGES_BASE cannot contain traversal segments',
    );
    expect(() => resolveWebBuildConfig('development', { WEB_PORT: '70000' })).toThrow(
      'WEB_PORT must be a valid TCP port',
    );
  });
});
