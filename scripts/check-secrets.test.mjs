import assert from 'node:assert/strict';
import test from 'node:test';
import { findSecretPatternMatches } from './check-secrets.mjs';

test('detects common credential formats without returning their values', () => {
  const syntheticToken = `ghp_${'x'.repeat(36)}`;
  const matches = findSecretPatternMatches(syntheticToken);
  assert.deepEqual(matches, ['GitHub token']);
  assert.equal(matches.includes(syntheticToken), false);
});

test('does not flag ordinary project configuration', () => {
  assert.deepEqual(
    findSecretPatternMatches('API_PORT=8787\nWEB_ORIGINS=https://docs.example.com'),
    [],
  );
});
