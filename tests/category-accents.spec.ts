import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { getCategoryAccent, getCategoryIcon } from '../src/lib/category-accents';

const globalCss = readFileSync(join(process.cwd(), 'src/styles/global.css'), 'utf8');
const categoryAccents = ['blue', 'violet', 'plum', 'coral', 'slate', 'moss'] as const;

function getThemeBlock(theme: 'light' | 'dark'): string {
  const selector = `[data-theme="${theme}"]`;
  const start = globalCss.indexOf(selector);
  const end = globalCss.indexOf('\n}', start);

  if (start === -1 || end === -1) {
    throw new Error(`Could not find the ${theme} theme token block`);
  }

  return globalCss.slice(start, end);
}

function getHexToken(block: string, token: string): string {
  const value = block.match(new RegExp(`${token}:\\s*(#[0-9a-fA-F]{6})`))?.[1];

  if (!value) {
    throw new Error(`Could not find ${token}`);
  }

  return value;
}

function relativeLuminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255);

  if (channels?.length !== 3) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

test.describe('category accent presentation', () => {
  test('matches the homepage focus-area accent palette', () => {
    expect(getCategoryAccent('Frontend architecture')).toBe('blue');
    expect(getCategoryAccent('Design systems')).toBe('moss');
    expect(getCategoryAccent('Accessibility')).toBe('coral');
    expect(getCategoryAccent('Performance')).toBe('slate');
    expect(getCategoryAccent('UX strategy')).toBe('violet');
  });

  test('maps the homepage focus areas to distinct icons', () => {
    expect(getCategoryIcon('Frontend architecture')).toBe('architecture');
    expect(getCategoryIcon('Design systems')).toBe('systems');
    expect(getCategoryIcon('Accessibility')).toBe('accessibility');
    expect(getCategoryIcon('Performance')).toBe('performance');
    expect(getCategoryIcon('UX strategy')).toBe('strategy');
  });

  test('keeps the green family category-specific rather than semantic', () => {
    expect(getCategoryAccent('Sustainability')).toBe('moss');
  });

  test('maps known categories consistently regardless of case or whitespace', () => {
    expect(getCategoryAccent(' Accessibility ')).toBe(getCategoryAccent('accessibility'));
  });

  test('uses a stable fallback for unknown categories', () => {
    const fallbackIcon = getCategoryIcon('Progressive enhancement');

    expect(getCategoryAccent('Progressive enhancement')).toBe(
      getCategoryAccent('Progressive enhancement'),
    );
    expect(fallbackIcon).toBeDefined();
    expect(fallbackIcon).toBe(getCategoryIcon('Progressive enhancement'));
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`${theme} category tokens meet normal-text contrast against the tag surface`, () => {
      const block = getThemeBlock(theme);
      const background = getHexToken(block, '--bg-surface-elevated');

      for (const accent of categoryAccents) {
        const foreground = getHexToken(block, `--accent-category-${accent}`);
        expect(contrastRatio(foreground, background), `${theme} ${accent}`).toBeGreaterThanOrEqual(
          4.5,
        );
      }
    });
  }
});
