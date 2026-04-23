import { readFile, readdir } from 'node:fs/promises';
import { basename, extname, join, relative } from 'node:path';

const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'coverage',
  '.next',
  '.turbo',
  '.idea'
]);

function shouldIgnoreDir(name) {
  return IGNORED_DIRS.has(name);
}

async function walk(rootPath, currentPath, collected) {
  const entries = await readdir(currentPath, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = join(currentPath, entry.name);

    if (entry.isDirectory()) {
      if (!shouldIgnoreDir(entry.name)) {
        await walk(rootPath, absolutePath, collected);
      }
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const relPath = relative(rootPath, absolutePath).replaceAll('\\', '/');
    const content = await readFile(absolutePath, 'utf8');
    collected.push({
      path: absolutePath,
      relPath,
      name: basename(absolutePath),
      ext: extname(absolutePath),
      content
    });
  }
}

export async function loadContext(rootPath) {
  const files = [];
  await walk(rootPath, rootPath, files);

  return {
    rootPath,
    files,
    findFiles(predicate) {
      return files.filter(predicate);
    },
    findFirst(predicate) {
      return files.find(predicate) ?? null;
    },
    hasAny(predicate) {
      return files.some(predicate);
    }
  };
}
