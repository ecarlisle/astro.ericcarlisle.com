#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const blogDir = resolve(repoRoot, 'src/content/blog');

function parseArgs() {
  const argv = process.argv.slice(2);
  return { dryRun: argv.includes('--dry-run') };
}

function discoverPosts() {
  const entries = readdirSync(blogDir, { withFileTypes: true });
  const posts = entries
    .filter((e) => e.isFile() && /\.mdx?$/.test(e.name))
    .map((e) => e.name)
    .sort();
  return posts;
}

function getSlug(filename) {
  return basename(filename)
    .replace(/\.mdx?$/, '')
    .toLowerCase();
}

function main() {
  const { dryRun } = parseArgs();
  const posts = discoverPosts();

  if (posts.length === 0) {
    console.error('No blog posts found in src/content/blog');
    process.exit(1);
  }

  console.log(`Discovered ${posts.length} blog posts in src/content/blog\n`);

  const scriptPath = resolve(__dirname, 'generate-hero-image.mjs');
  let seed = 456;

  for (const filename of posts) {
    const slug = getSlug(filename);
    console.log(`--- ${slug} ---`);

    const args = ['node', scriptPath, resolve(blogDir, filename), '--seed', String(seed++)];

    if (dryRun) {
      args.push('--dry-run');
    }

    const cmd = args.map((a) => `"${a.replace(/"/g, '\\"')}"`).join(' ');

    try {
      execSync(cmd, { stdio: 'inherit', timeout: 600000 });
    } catch {
      console.error(`  FAILED: ${slug}`);
      process.exit(1);
    }
  }

  console.log('\nAll images regenerated.\n');
}

main();
