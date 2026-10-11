import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';

const workspaceRoot = path.resolve(import.meta.dirname, '..');
const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];

function collectSourceFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(entryPath);
    return sourceExtensions.includes(path.extname(entry.name)) && !entry.name.endsWith('.d.ts')
      ? [entryPath]
      : [];
  });
}

function resolveLocalImport(importer, specifier) {
  if (!specifier.startsWith('.')) return undefined;
  const basePath = path.resolve(path.dirname(importer), specifier);
  const specifierExtension = path.extname(basePath);
  const extensionlessPath = specifierExtension
    ? basePath.slice(0, -specifierExtension.length)
    : basePath;
  const candidates = [
    basePath,
    ...sourceExtensions.map((extension) => `${basePath}${extension}`),
    ...(specifierExtension === '.js'
      ? [`${extensionlessPath}.ts`, `${extensionlessPath}.tsx`]
      : []),
  ];
  for (const extension of sourceExtensions) {
    candidates.push(path.join(basePath, `index${extension}`));
  }
  return candidates.find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );
}

function isWithin(filePath, directory) {
  const relativePath = path.relative(directory, filePath);
  return relativePath !== '' && !relativePath.startsWith(`..${path.sep}`) && relativePath !== '..';
}

function importedSpecifiers(sourceText) {
  const sourceFile = parse(sourceText, {
    sourceType: 'unambiguous',
    plugins: ['typescript', 'jsx'],
  });
  const specifiers = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (
      (node.type === 'ImportDeclaration' ||
        node.type === 'ExportAllDeclaration' ||
        node.type === 'ExportNamedDeclaration') &&
      typeof node.source?.value === 'string'
    ) {
      specifiers.push(node.source.value);
    }
    if (
      (node.type === 'ImportExpression' ||
        (node.type === 'CallExpression' && node.callee?.type === 'Import')) &&
      node.source?.type === 'StringLiteral'
    ) {
      specifiers.push(node.source.value);
    }
    if (
      node.type === 'CallExpression' &&
      node.callee?.type === 'Import' &&
      node.arguments[0]?.type === 'StringLiteral'
    ) {
      specifiers.push(node.arguments[0].value);
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) if (child && typeof child.type === 'string') visit(child);
      } else if (value && typeof value.type === 'string') {
        visit(value);
      }
    }
  }
  visit(sourceFile);
  return specifiers;
}

export function findModuleBoundaryViolations(root = workspaceRoot) {
  const webRoot = path.join(root, 'apps', 'web');
  const apiRoot = path.join(root, 'apps', 'api');
  const featureRoot = path.join(webRoot, 'src', 'features');
  const sourceFiles = [
    ...collectSourceFiles(path.join(webRoot, 'src')),
    ...collectSourceFiles(path.join(apiRoot, 'src')),
  ];
  const graph = new Map(sourceFiles.map((filePath) => [filePath, []]));
  const violations = [];

  for (const filePath of sourceFiles) {
    const sourceText = fs.readFileSync(filePath, 'utf8');
    const isWebFile = isWithin(filePath, path.join(webRoot, 'src'));

    for (const specifier of importedSpecifiers(sourceText)) {
      if (isWebFile && /^@greendocs\/(?!contracts(?:\/|$))/.test(specifier)) {
        violations.push(
          `${path.relative(root, filePath)} imports forbidden workspace package ${specifier}`,
        );
      }

      const targetPath = resolveLocalImport(filePath, specifier);
      if (!targetPath) continue;
      if (isWebFile && isWithin(targetPath, path.join(apiRoot, 'src'))) {
        violations.push(
          `${path.relative(root, filePath)} imports server source ${path.relative(root, targetPath)}`,
        );
      }
      if (!isWebFile && isWithin(targetPath, path.join(webRoot, 'src'))) {
        violations.push(
          `${path.relative(root, filePath)} imports browser source ${path.relative(root, targetPath)}`,
        );
      }
      graph.get(filePath)?.push(targetPath);

      const targetFeature = path.dirname(targetPath);
      if (isWebFile && isWithin(targetPath, featureRoot) && !isWithin(filePath, targetFeature)) {
        const targetName = path.basename(targetPath);
        if (targetName !== 'index.ts' && targetName !== 'index.tsx') {
          violations.push(
            `${path.relative(root, filePath)} reaches into feature internals at ${path.relative(root, targetPath)}`,
          );
        }
      }
    }
  }

  const visiting = new Set();
  const visited = new Set();
  const visit = (filePath, route = []) => {
    if (visiting.has(filePath)) {
      const cycle = [...route.slice(route.indexOf(filePath)), filePath]
        .map((item) => path.relative(root, item))
        .join(' -> ');
      violations.push(`Circular module dependency: ${cycle}`);
      return;
    }
    if (visited.has(filePath)) return;
    visiting.add(filePath);
    for (const dependency of graph.get(filePath) ?? []) visit(dependency, [...route, filePath]);
    visiting.delete(filePath);
    visited.add(filePath);
  };
  for (const filePath of graph.keys()) visit(filePath);

  return [...new Set(violations)];
}

const violations = findModuleBoundaryViolations();
if (violations.length > 0) {
  console.error(violations.map((violation) => `- ${violation}`).join('\n'));
  process.exitCode = 1;
} else {
  console.info('Module boundaries verified.');
}
