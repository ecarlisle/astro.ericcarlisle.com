#!/usr/bin/env node
/**
 * Minimal static file server for local Lighthouse audits.
 *
 * Usage:
 *   node scripts/static-server.mjs <directory> <port>
 */

import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, isAbsolute, join, normalize, relative, resolve } from 'node:path';

const root = resolve(process.argv[2] || '.');
const port = Number.parseInt(process.argv[3] || '4321', 10);

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.avif', 'image/avif'],
  ['.ico', 'image/x-icon'],
  ['.xml', 'application/xml'],
  ['.txt', 'text/plain; charset=utf-8'],
]);

function contentTypeFor(filePath) {
  return contentTypes.get(extname(filePath).toLowerCase()) || 'application/octet-stream';
}

function isWithinRoot(targetPath) {
  const rel = relative(root, targetPath);
  return !rel.startsWith('..') && !isAbsolute(rel);
}

async function resolveFile(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }

  if (decoded.includes('\0')) return null;

  const target = resolve(join(root, normalize(decoded)));
  if (!isWithinRoot(target)) return null;

  const candidates = [];

  try {
    const targetStat = await stat(target);
    if (targetStat.isDirectory()) {
      candidates.push(join(target, 'index.html'));
    } else if (targetStat.isFile()) {
      candidates.push(target);
    }
  } catch {
    // Target does not exist; try fallback candidates.
  }

  if (!extname(target)) {
    candidates.push(`${target}.html`);
  }

  for (const candidate of candidates) {
    try {
      const candidateStat = await stat(candidate);
      if (candidateStat.isFile()) return candidate;
    } catch {
      // Try next candidate.
    }
  }

  return null;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${port}`);
  const filePath = await resolveFile(url.pathname);

  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  res.writeHead(200, { 'Content-Type': contentTypeFor(filePath) });
  const stream = createReadStream(filePath);
  stream.pipe(res);
  stream.on('error', () => {
    res.destroy();
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Serving ${root} at http://127.0.0.1:${port}`);
});
