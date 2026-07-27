#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageScripts = JSON.parse(
  readFileSync(resolve(repositoryRoot, 'package.json'), 'utf8'),
).scripts;
const files = [
  'AGENTS.md',
  'README.md',
  'docs/agent-workflow.md',
  'docs/testing.md',
  ...skillFiles(),
];
const pnpmBuiltins = new Set(['add', 'dlx', 'exec', 'install', 'remove', 'run']);
const errors = [];

for (const path of files) {
  const source = readFileSync(resolve(repositoryRoot, path), 'utf8');
  validateCommands(path, source);
  validateLinks(path, source);
}

if (errors.length > 0) {
  console.error(`Agent documentation validation failed (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Agent documentation valid (${files.length} files)`);

function skillFiles() {
  const agents = readFileSync(resolve(repositoryRoot, 'AGENTS.md'), 'utf8');
  return [...agents.matchAll(/\]\((\.agents\/skills\/[^)#]+\/SKILL\.md)(?:#[^)]+)?\)/g)]
    .map((match) => match[1])
    .filter((path, index, paths) => paths.indexOf(path) === index);
}

function validateCommands(path, source) {
  for (const match of source.matchAll(/`pnpm ([a-z][\w:-]*)/g)) {
    const command = match[1];
    if (!pnpmBuiltins.has(command) && !Object.hasOwn(packageScripts, command)) {
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
