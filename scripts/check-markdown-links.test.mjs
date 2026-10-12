import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { findBrokenMarkdownLinks } from './check-markdown-links.mjs';

function withMarkdownFiles(files, callback) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'greendocs-links-'));
  try {
    for (const [file, contents] of Object.entries(files)) {
      const target = path.join(root, file);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, contents);
    }
    callback(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('accepts relative files, valid heading anchors, external links, and code examples', () => {
  withMarkdownFiles(
    {
      'README.md': [
        '[guide](docs/guide.md#setup)',
        '[web](https://example.com/docs)',
        '`[not a link](missing.md)`',
        '```md',
        '[also not a link](missing.md)',
        '```',
      ].join('\n'),
      'docs/guide.md': '# Setup',
    },
    (root) => assert.deepEqual(findBrokenMarkdownLinks(root), []),
  );
});

test('reports missing targets and heading anchors with source line numbers', () => {
  withMarkdownFiles(
    {
      'README.md': ['# Home', '[missing](docs/missing.md)', '[bad anchor](guide.md#nope)'].join(
        '\n',
      ),
      'guide.md': '# Guide',
    },
    (root) => {
      assert.deepEqual(
        findBrokenMarkdownLinks(root).map(({ line, reason }) => ({ line, reason })),
        [
          { line: 2, reason: 'target does not exist' },
          { line: 3, reason: 'heading anchor does not exist' },
        ],
      );
    },
  );
});

test('supports duplicate heading anchors and reference link definitions', () => {
  withMarkdownFiles(
    {
      'README.md': '[First](guide.md#topic) [Second](guide.md#topic-1)\n[ref]: guide.md#topic',
      'guide.md': '# Topic\n# Topic',
    },
    (root) => assert.deepEqual(findBrokenMarkdownLinks(root), []),
  );
});
