#!/usr/bin/env node

/**
 * validate-no-blog-h1.mjs
 *
 * Validates that blog Markdown/MDX files under src/content/blog/ do not
 * contain a top-level h1 heading. The BlogPost layout already renders
 * the article title from frontmatter as <h1>{title}</h1>, so a second h1
 * in the content body is redundant.
 *
 * Usage:
 *   node scripts/validate-no-blog-h1.mjs                         # scan all blog files
 *   node scripts/validate-no-blog-h1.mjs path/to/file.mdx ...    # scan specific files
 *
 * Exit code 0 = all clear.  Exit code 1 = violations found.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const BLOG_DIR = resolve(REPO_ROOT, 'src/content/blog');

// Patterns for h1 detection (regexps are anchored by line context, not /^/)
const ATX_H1 = /^#[ \t]+|^#[ \t]*$/; // "# " at line start
const SETEXT_H1 = /^={3,}\s*$/; // "===" line (setext underline)
const RAW_HTML_H1 = /<h1[\s>]/i; // opening <h1 ...> tag

// ── Helpers ────────────────────────────────────────────────

/**
 * Strip YAML frontmatter (the first --- ... --- block).
 * Returns the body-only text.
 */
function stripFrontmatter(text) {
  // Must start with "---" on first line
  if (!text.startsWith('---') && !text.startsWith('---\n')) {
    return text;
  }
  const endIdx = text.indexOf('---', 3); // find closing "---"
  if (endIdx === -1) return text; // malformed, don't flag
  return text.slice(endIdx + 3);
}

/**
 * Return an array of lines with reduced context excluding:
 *   - fenced code blocks (``` or ~~~)
 *   - inline code spans (replaced with spaces to avoid false matches)
 *   - HTML comments
 */
function getContentLines(bodyText) {
  let text = bodyText;

  // Strip fenced code blocks (``` and ~~~)
  text = text.replace(/^```[\s\S]*?^```/gm, '');
  text = text.replace(/^~~~[\s\S]*?^~~~/gm, '');

  // Strip HTML comments <!-- ... -->
  text = text.replace(/<!--[\s\S]*?-->/g, '');

  // Replace inline code spans (single backticks) with spaces
  // so that `# not-a-heading` doesn't match as h1
  text = text.replace(/`[^`]+`/g, (m) => ' '.repeat(m.length));

  return text.split('\n');
}

/**
 * Check a single file for h1 violations. Returns an array of error objects
 * { line, content, pattern } or [] if clean.
 */
function checkFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const body = stripFrontmatter(content);
  const lines = getContentLines(body);
  const errors = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // ATX h1: # Heading
    if (ATX_H1.test(line)) {
      const trimmed = line.trimStart();
      // Make sure we aren't matching an empty # line with nothing after it,
      // and that the # is actually an ATX heading (followed by a space, or
      // is the whole line which is still a valid ATX heading "#")
      if (
        trimmed.startsWith('#') &&
        (trimmed.length === 1 || trimmed[1] === ' ' || trimmed[1] === '\t')
      ) {
        errors.push({
          line: i + 1,
          content: trimmed,
          pattern: 'ATX',
        });
        continue;
      }
    }

    // Setext h1: Previous line + "======="
    // The setext underline is on this line; the heading text is the previous non-empty line.
    if (SETEXT_H1.test(line)) {
      // Find the preceding non-empty line (skipping blank lines)
      let prevLineIdx = i - 1;
      while (prevLineIdx >= 0 && lines[prevLineIdx].trim() === '') {
        prevLineIdx--;
      }
      const prevLine = prevLineIdx >= 0 ? lines[prevLineIdx].trim() : '';
      // This is a setext h1 if the previous line has content and this line is ===
      if (prevLine && !ATX_H1.test(prevLine) && !prevLine.startsWith('#')) {
        errors.push({
          line: i + 1,
          content: `${prevLine}\n${line.trim()}`,
          pattern: 'SETEXT',
        });
      }
    }

    // Raw HTML h1: <h1...>
    if (RAW_HTML_H1.test(line)) {
      errors.push({
        line: i + 1,
        content: line.trim(),
        pattern: 'HTML',
      });
    }
  }

  return errors;
}

// ── File discovery ─────────────────────────────────────────

/** Recursively find .md and .mdx files under a directory. */
function findBlogFiles(dir = BLOG_DIR) {
  const files = [];
  function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (ext === '.md' || ext === '.mdx') {
          files.push(full);
        }
      }
    }
  }
  walk(dir);
  return files;
}

// ── Main ──────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);

  // If file paths provided, use them; otherwise scan blog dir
  const files = args.length > 0 ? args : findBlogFiles();

  let hasErrors = false;

  for (const filePath of files) {
    // Resolve relative paths
    const resolved = resolve(process.cwd(), filePath);

    // Skip if file doesn't exist (for explicit paths)
    if (args.length > 0) {
      try {
        statSync(resolved);
      } catch {
        console.error(`File not found: ${filePath}`);
        continue;
      }
    }

    const errors = checkFile(resolved);

    for (const err of errors) {
      const relPath = resolved.startsWith(`${REPO_ROOT}/`)
        ? resolved.slice(REPO_ROOT.length + 1)
        : resolved;

      const patternHint = err.pattern === 'ATX' ? '#' : err.pattern === 'SETEXT' ? '====' : '<h1>';

      console.log(`\n\x1b[31m✖\x1b[0m ${relPath}:${err.line}`);
      console.log(`  ${patternHint}  ${err.content}`);
      if (!hasErrors) {
        console.log('');
        console.log('  Top-level headings are not allowed in blog content.');
        console.log('  BlogPost.astro already renders the article title as the page h1.');
        console.log('');
        console.log('  Remove the top-level heading from the content body.');
        console.log('');
      }
      hasErrors = true;
    }
  }

  if (!hasErrors) {
    console.log(`\x1b[32m✓\x1b[0m No top-level headings found in blog content.`);
  }

  process.exit(hasErrors ? 1 : 0);
}

main();
