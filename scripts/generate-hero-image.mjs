#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

//const DEFAULT_STYLE =
//  'Minimalist vector line art, crisp ink illustration style, high contrast, clean solid dark gray background, precise geometric line weights, modern tech editorial vignette';
const DEFAULT_STYLE =
  'Create a thoughtful editorial illustration for a professional technology blog. Use a refined dark editorial palette: deep navy, muted slate blue, soft cyan, desaturated periwinkle, warm ivory highlights, and restrained amber accents. Use bold but controlled linework, layered shapes, and a clear visual metaphor connected to the article topic. Favor meaningful objects, diagrams, interfaces, tools, documents, light, architecture, systems, pathways, or human-scale workspaces. Keep the composition full-bleed, polished, calm, modern, and slightly playful. Avoid generic tech clichés, random floating symbols, fake text, labels, captions, speech bubbles, comic panels, borders, grids, watermarks, or logos.';
function resolvePostPath(input) {
  const blogDir = resolve(repoRoot, 'src/content/blog');
  const candidates = [resolve(input)];
  if (!input.includes('/')) {
    candidates.push(resolve(blogDir, input));
    if (!input.endsWith('.mdx')) {
      candidates.push(resolve(blogDir, `${input}.mdx`));
    }
  }
  return candidates.find(existsSync);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { width: 1216, height: 640, steps: 9 };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--post':
      case '-p':
        opts.post = resolvePostPath(args[++i]);
        break;
      case '--prompt':
        opts.prompt = args[++i];
        break;
      case '--style':
        opts.style = args[++i];
        break;
      case '--width':
        opts.width = parseInt(args[++i], 10);
        break;
      case '--height':
        opts.height = parseInt(args[++i], 10);
        break;
      case '--steps':
        opts.steps = parseInt(args[++i], 10);
        break;
      case '--seed':
        opts.seed = parseInt(args[++i], 10);
        break;
      case '--dry-run':
        opts.dryRun = true;
        break;
      default:
        if (!opts.post && !args[i].startsWith('--')) {
          opts.post = resolvePostPath(args[i]);
        }
    }
  }

  if (!opts.post) {
    console.error('Usage: node scripts/generate-hero-image.mjs [--post] <slug> [options]');
    console.error('  --prompt <text>     Subject override (strongest override)');
    console.error('  --style <text>      Visual style override (default: dark editorial tech)');
    console.error('  --steps <n>         Inference steps (default: 9)');
    console.error('  --seed <n>          Random seed for reproducibility');
    console.error('  --dry-run           Preview only');
    console.error('  Frontmatter field  heroPrompt (used when --prompt is not given)');
    console.error(
      '  Model: flux_2_klein_4b_q6p.ckpt (draw-things-cli), 1216x640 → cropped to 1200x630',
    );
    process.exit(1);
  }

  return opts;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!match) {
    console.error('No valid frontmatter found');
    process.exit(1);
  }

  const raw = match[1];
  const fields = {};

  for (const line of raw.split('\n')) {
    const sep = line.search(/:\s*/);
    if (sep === -1) continue;
    const key = line.slice(0, sep).trim();
    const val = line
      .slice(sep + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');
    fields[key] = val;
  }

  return { fields, raw, fullMatch: match[0], prefix: match[0].length };
}

function parseTags(raw) {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (!trimmed.startsWith('[')) return [trimmed];
  return trimmed
    .slice(1, -1)
    .split(',')
    .map((t) => t.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

function buildSubject(fields, override) {
  // --prompt is the strongest override
  if (override) {
    console.log('  Source: --prompt');
    return override;
  }

  // heroPrompt from frontmatter
  if (fields.heroPrompt) {
    console.log('  Source: heroPrompt');
    return fields.heroPrompt;
  }

  // Build from title, description, and tags
  const title = fields.title;
  const desc = fields.description;
  const tags = parseTags(fields.tags);

  if (title || desc) {
    console.log('  Source: title/description/tags');
    let subject = 'A meaningful editorial illustration';
    if (title) subject += ` about "${title}"`;
    subject += '. Use a clear visual metaphor that reflects the article topic.';
    if (tags.length > 0) {
      subject += ` Related themes: ${tags.join(', ')}.`;
    }
    subject += ' No readable text.';
    return subject;
  }

  // Fallback
  console.log('  Source: fallback');
  return 'A meaningful editorial illustration for a frontend engineering article, using visual metaphor rather than readable text.';
}

function getSlug(postPath) {
  const base = basename(postPath).replace(/\.mdx?$/, '');
  return base.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
}

function updateFrontmatter(content, slug) {
  const heroLine = `heroImage: '@images/${slug}-hero.webp'`;

  if (/^heroImage:/m.test(content)) {
    return content.replace(/^heroImage:.*$/m, heroLine);
  }

  return content.replace(/^---\s*\n/m, `---\n${heroLine}\n`);
}

async function main() {
  const opts = parseArgs();

  if (!existsSync(opts.post)) {
    console.error(`File not found: ${opts.post}`);
    process.exit(1);
  }

  const content = readFileSync(opts.post, 'utf-8');
  const { fields } = parseFrontmatter(content);
  const slug = getSlug(opts.post);

  const subject = buildSubject(fields, opts.prompt);
  const style = opts.style ?? DEFAULT_STYLE;
  const prompt = style ? `${subject}. ${style}` : subject;

  const outputPath = resolve(repoRoot, 'src', 'assets', 'images', `${slug}-hero.webp`);
  const relOutput = `src/assets/images/${slug}-hero.webp`;
  const rawPng = outputPath.replace('.webp', '.raw.png');
  const cropW = 1200;
  const cropH = 630;

  console.log(`\n  Post:      ${opts.post}`);
  console.log(`  Slug:      ${slug}`);
  console.log(`  Image:     ${relOutput}`);
  console.log(`  Generated: ${opts.width}x${opts.height}`);
  console.log(`  Final:     ${cropW}x${cropH} (center crop)`);
  console.log(`  Steps:     ${opts.steps}`);
  console.log(`  Subject:   ${subject}`);
  console.log(`  Style:     ${style}`);
  console.log();

  if (opts.dryRun) {
    console.log('  [dry-run] No changes made.\n');
    console.log('  Full prompt sent to model:\n');
    console.log(`  ${prompt}\n`);
    return;
  }

  if (existsSync(outputPath)) {
    console.log(`  Overwriting existing image at ${relOutput}.\n`);
  }

  const scriptPath = resolve(__dirname, 'mflux-generate-image');
  const generateArgs = [
    '--prompt',
    prompt,
    '--negative-prompt',
    'text, letters, fake words, labels, captions, speech bubbles, title, watermark, signature, logo, UI screenshot, random code, generic circuit board, robot, floating icons, multiple panels, comic strip, grid layout, frame border, cells, distorted hands, extra fingers',
    '--output',
    rawPng,
    '--width',
    String(opts.width),
    '--height',
    String(opts.height),
    '--steps',
    String(opts.steps),
  ];
  if (opts.seed) {
    generateArgs.push('--seed', String(opts.seed));
  }

  // Check for required system tools
  for (const tool of ['sips', 'cwebp']) {
    try {
      execSync(`which "${tool}"`, { stdio: 'ignore' });
    } catch {
      console.error(`  Error: ${tool} not found. Install it to generate hero images.`);
      process.exit(1);
    }
  }

  console.log('  Generating image...');
  try {
    execSync(`${scriptPath} ${generateArgs.map((a) => `"${a.replace(/"/g, '\\"')}"`).join(' ')}`, {
      stdio: 'inherit',
      timeout: 600000,
    });
  } catch {
    console.error('\n  Image generation failed.\n');
    process.exit(1);
  }

  if (!existsSync(rawPng)) {
    console.error(`\n  Error: generated image not found at ${rawPng}\n`);
    process.exit(1);
  }

  // Crop to social/OG dimensions (1200×630)
  console.log('  Cropping to 1200x630...');
  const croppedPng = outputPath.replace('.webp', '-cropped.png');
  execSync(`sips --cropToHeightWidth ${cropH} ${cropW} "${rawPng}" --out "${croppedPng}"`, {
    stdio: 'inherit',
  });

  // Convert to WebP
  console.log('  Converting to WebP...');
  execSync(`cwebp -quiet -q 85 "${croppedPng}" -o "${outputPath}"`, { stdio: 'inherit' });

  // Clean up temp files
  rmSync(rawPng);
  rmSync(croppedPng);

  // Verify final image dimensions — fail if not 1200×630
  const result = execSync(`sips -g pixelWidth -g pixelHeight "${outputPath}"`, {
    encoding: 'utf-8',
  });
  const lines = result.split('\n');
  const w = lines
    .find((l) => l.includes('pixelWidth'))
    ?.split(':')
    .pop()
    ?.trim();
  const h = lines
    .find((l) => l.includes('pixelHeight'))
    ?.split(':')
    .pop()
    ?.trim();
  if (w === String(cropW) && h === String(cropH)) {
    console.log(`  Verified: ${w}x${h} ✓`);
  } else {
    console.error(`  Error: expected ${cropW}x${cropH}, got ${w}x${h}`);
    process.exit(1);
  }

  const updated = updateFrontmatter(content, slug);
  writeFileSync(opts.post, updated);

  console.log(`\n  Done. ${basename(opts.post)} updated with ${relOutput}\n`);
}

main();
