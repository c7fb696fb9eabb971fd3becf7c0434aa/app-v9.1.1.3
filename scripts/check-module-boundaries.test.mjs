import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { findModuleBoundaryViolations } from './check-module-boundaries.mjs';

test('web modules use public feature APIs and do not depend on server internals', () => {
  assert.deepEqual(findModuleBoundaryViolations(), []);
});

test('rejects browser imports of server source and private feature files', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'greendocs-boundaries-'));
  const webRoot = path.join(root, 'apps', 'web', 'src');
  const apiRoot = path.join(root, 'apps', 'api', 'src');
  const authRoot = path.join(webRoot, 'features', 'auth');
  const navigationRoot = path.join(webRoot, 'features', 'navigation');

  try {
    for (const directory of [webRoot, apiRoot, authRoot, navigationRoot]) {
      fs.mkdirSync(directory, { recursive: true });
    }
    fs.writeFileSync(path.join(apiRoot, 'adapter.ts'), 'export const adapter = {};');
    fs.writeFileSync(path.join(authRoot, 'AuthContext.ts'), 'export const auth = {};');
    fs.writeFileSync(
      path.join(navigationRoot, 'SiteHeader.ts'),
      [
        "import { adapter } from '../../../../api/src/adapter.js';",
        "import { auth } from '../auth/AuthContext';",
        "import type { ApiError } from '@greendocs/api';",
        'export { adapter, auth, ApiError };',
      ].join('\n'),
    );

    const violations = findModuleBoundaryViolations(root);
    assert(violations.some((violation) => violation.includes('imports server source')));
    assert(violations.some((violation) => violation.includes('forbidden workspace package')));
    assert(violations.some((violation) => violation.includes('reaches into feature internals')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
