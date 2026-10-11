import fs from 'node:fs';
import path from 'node:path';

const workspaceRoot = path.resolve(import.meta.dirname, '..');
const ignoredDirectories = new Set(['.git', 'node_modules', '.pnpm-store', 'coverage']);
const textExtensions = new Set([
  '.cjs',
  '.css',
  '.d.ts',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.ts',
  '.tsx',
  '.txt',
  '.yml',
  '.yaml',
]);
const secretPatterns = [
  { name: 'GitHub token', pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/ },
  { name: 'GitHub fine-grained token', pattern: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/ },
  {
    name: 'private key',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
  { name: 'AWS access key', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
];

export function findSecretPatternMatches(text) {
  return secretPatterns.filter(({ pattern }) => pattern.test(text)).map(({ name }) => name);
}

function isTextFile(filePath, name) {
  return (
    name.startsWith('.env') ||
    ['.editorconfig', '.gitignore', '.node-version', '.npmrc', '.nvmrc'].includes(name) ||
    textExtensions.has(path.extname(filePath))
  );
}

function scanDirectory(directory, matches = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name))
        scanDirectory(path.join(directory, entry.name), matches);
      continue;
    }
    const filePath = path.join(directory, entry.name);
    if (!entry.isFile() || !isTextFile(filePath, entry.name)) continue;
    const content = fs.readFileSync(filePath, 'utf8');
    for (const rule of findSecretPatternMatches(content)) {
      matches.push({ file: path.relative(workspaceRoot, filePath), rule });
    }
  }
  return matches;
}

const matches = scanDirectory(workspaceRoot);
if (matches.length > 0) {
  console.error(matches.map(({ file, rule }) => `- ${file}: ${rule}`).join('\n'));
  process.exitCode = 1;
} else {
  console.info('No known credential patterns found in workspace text files.');
}
