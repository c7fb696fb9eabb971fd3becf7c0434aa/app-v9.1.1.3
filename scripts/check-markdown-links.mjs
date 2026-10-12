import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ignoredDirectories = new Set(['.git', 'node_modules', '.pnpm-store', 'coverage', 'dist']);

function collectMarkdownFiles(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name))
        collectMarkdownFiles(path.join(directory, entry.name), files);
      continue;
    }
    if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.md') {
      files.push(path.join(directory, entry.name));
    }
  }
  return files;
}

function maskMarkdownCode(content) {
  return content
    .replace(
      /(^|\n)(```|~~~)[^\n]*\n[\s\S]*?\n\2[^\n]*(?=\n|$)/g,
      (block, prefix) => prefix + block.slice(prefix.length).replace(/[^\n]/g, ' '),
    )
    .replace(/`+[^`\n]*`+/g, (code) => code.replace(/[^\n]/g, ' '))
    .replace(/<!--[\s\S]*?-->/g, (comment) => comment.replace(/[^\n]/g, ' '));
}

function extractMarkdownLinks(content) {
  const source = maskMarkdownCode(content);
  const links = [];
  const inlineLink = /!?\[[^\]]*\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+[^)]*)?\)/g;
  const referenceDefinition = /^\s*\[[^\]]+\]:\s*(<[^>]+>|\S+)/gm;
  let match;

  while ((match = inlineLink.exec(source)) !== null) {
    links.push({ destination: match[1], offset: match.index });
  }
  while ((match = referenceDefinition.exec(source)) !== null) {
    links.push({ destination: match[1], offset: match.index });
  }
  return links;
}

function headingAnchors(content) {
  const anchors = new Set();
  const counts = new Map();
  const source = maskMarkdownCode(content);
  const headingPattern = /^ {0,3}#{1,6}\s+(.+?)\s*#*\s*$/gm;
  let match;

  while ((match = headingPattern.exec(source)) !== null) {
    const explicitId = match[1].match(/\s+\{#([^}]+)\}\s*$/)?.[1];
    const title = match[1].replace(/\s+\{#[^}]+\}\s*$/, '');
    let slug =
      explicitId ??
      title
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\p{L}\p{N}_-]/gu, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    const base = slug;
    const count = counts.get(base) ?? 0;
    counts.set(base, count + 1);
    if (count > 0) slug = `${base}-${count}`;
    anchors.add(slug);
  }
  for (const id of source.matchAll(/\s(?:id|name)="([^"]+)"/gi)) {
    anchors.add(id[1]);
  }
  return anchors;
}

function decodeLinkPart(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function findBrokenMarkdownLinks(root = workspaceRoot) {
  const rootPath = path.resolve(root);
  const failures = [];
  for (const markdownFile of collectMarkdownFiles(rootPath)) {
    const content = fs.readFileSync(markdownFile, 'utf8');
    for (const { destination: rawDestination, offset } of extractMarkdownLinks(content)) {
      const destination =
        rawDestination.startsWith('<') && rawDestination.endsWith('>')
          ? rawDestination.slice(1, -1)
          : rawDestination;
      if (!destination || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(destination)) continue;

      const [rawPath, rawFragment = ''] = destination.split('#', 2);
      const linkPath = decodeLinkPart(rawPath.split('?', 1)[0]);
      const sourceDirectory = path.dirname(path.relative(rootPath, markdownFile));
      const target = path.resolve(
        rootPath,
        linkPath.startsWith('/')
          ? linkPath.slice(1)
          : path.join(sourceDirectory, linkPath || path.basename(markdownFile)),
      );
      const line = content.slice(0, offset).split('\n').length;

      if (!target.startsWith(`${rootPath}${path.sep}`) && target !== rootPath) {
        failures.push({
          file: path.relative(rootPath, markdownFile),
          line,
          destination,
          reason: 'outside workspace',
        });
        continue;
      }
      if (!fs.existsSync(target)) {
        failures.push({
          file: path.relative(rootPath, markdownFile),
          line,
          destination,
          reason: 'target does not exist',
        });
        continue;
      }
      if (
        rawFragment &&
        fs.statSync(target).isFile() &&
        path.extname(target).toLowerCase() === '.md'
      ) {
        const fragment = decodeLinkPart(rawFragment);
        if (!headingAnchors(fs.readFileSync(target, 'utf8')).has(fragment)) {
          failures.push({
            file: path.relative(rootPath, markdownFile),
            line,
            destination,
            reason: 'heading anchor does not exist',
          });
        }
      }
    }
  }
  return failures;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const failures = findBrokenMarkdownLinks();
  if (failures.length > 0) {
    console.error(
      failures
        .map(
          ({ file, line, destination, reason }) => `- ${file}:${line}: ${destination} (${reason})`,
        )
        .join('\n'),
    );
    process.exitCode = 1;
  } else {
    console.info('All local Markdown links resolve.');
  }
}
