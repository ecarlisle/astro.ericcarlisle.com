#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageScripts = readScripts('package.json');
// Docs whose commands run inside a sub-package also accept that package's scripts.
const subpackageScripts = {
  'docs/deployment-contact-worker.md': readScripts('contact-worker/package.json'),
};
const generatedDocs = new Set(['docs/context']);
const files = ['AGENTS.md', 'README.md', ...markdownFiles('docs'), ...skillFiles()].filter(
  (path, index, paths) => paths.indexOf(path) === index,
);
const pnpmBuiltins = new Set(['add', 'dlx', 'exec', 'install', 'remove', 'run']);
const errors = [];

for (const path of files) {
  const source = readFileSync(resolve(repositoryRoot, path), 'utf8');
  validateCommands(path, source);
  validateLinks(path, withoutCodeFences(source));
}

if (errors.length > 0) {
  console.error(`Agent documentation validation failed (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Agent documentation valid (${files.length} files)`);

function readScripts(path) {
  return JSON.parse(readFileSync(resolve(repositoryRoot, path), 'utf8')).scripts;
}

function markdownFiles(directory) {
  if (generatedDocs.has(directory)) return [];
  return readdirSync(resolve(repositoryRoot, directory), { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return markdownFiles(path);
      return extname(entry.name) === '.md' ? [path] : [];
    });
}

function withoutCodeFences(source) {
  return source.replace(/^```[\s\S]*?^```/gm, '');
}

function skillFiles() {
  const agents = readFileSync(resolve(repositoryRoot, 'AGENTS.md'), 'utf8');
  return [...agents.matchAll(/\]\((\.agents\/skills\/[^)#]+\/SKILL\.md)(?:#[^)]+)?\)/g)]
    .map((match) => match[1])
    .filter((path, index, paths) => paths.indexOf(path) === index);
}

function validateCommands(path, source) {
  for (const match of source.matchAll(/`pnpm ([a-z][\w:-]*)/g)) {
    const command = match[1];
    const extraScripts = subpackageScripts[path] ?? {};
    if (
      !pnpmBuiltins.has(command) &&
      !Object.hasOwn(packageScripts, command) &&
      !Object.hasOwn(extraScripts, command)
    ) {
      errors.push(`${path}: documented package script does not exist: pnpm ${command}`);
    }
  }
}

function validateLinks(path, source) {
  for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1];
    if (/^(?:https?:|mailto:|\/|#)/.test(target)) continue;
    const [fileTarget, fragment] = target.split('#', 2);
    const absoluteTarget = resolve(repositoryRoot, dirname(path), decodeURIComponent(fileTarget));
    if (!existsSync(absoluteTarget)) {
      errors.push(`${path}: local link target does not exist: ${target}`);
      continue;
    }
    if (fragment && ['.md', '.mdx', '.markdown'].includes(extname(absoluteTarget).toLowerCase())) {
      validateHeading(path, target, absoluteTarget, decodeURIComponent(fragment));
    }
  }
}

function validateHeading(sourcePath, target, absoluteTarget, fragment) {
  const headings = readFileSync(absoluteTarget, 'utf8')
    .split(/\r?\n/)
    .filter((line) => /^#{1,6}\s+\S/.test(line.trim()))
    .map((line) => headingAnchor(line));
  if (!headings.includes(fragment)) {
    errors.push(
      `${sourcePath}: heading anchor does not exist in ${relative(repositoryRoot, absoluteTarget)}: ${target}`,
    );
  }
}

function headingAnchor(heading) {
  return heading
    .trim()
    .replace(/^#{1,6}\s+/, '')
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\p{Letter}\p{Number}\s_-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}
