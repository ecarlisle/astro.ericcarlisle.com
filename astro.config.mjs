// @ts-check

import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import expressiveCode from 'astro-expressive-code';
import pagefind from 'astro-pagefind';

// https://astro.build/config
export default defineConfig({
  site: 'https://ericcarlisle.com',
  integrations: [
    partytown({
      config: {
        forward: ['dataLayer.push'],
      },
    }),
    expressiveCode({
      themes: ['dark-plus'],
      styleOverrides: {
        codeFontFamily: 'var(--font-mono)',
        uiFontFamily: 'var(--font-copy)',
        borderRadius: 'var(--radius-md)',
        frames: {
          editorTabBarBackground: 'oklch(0.18 0.025 280)',
          editorActiveTabBackground: 'oklch(0.12 0.015 280)',
          terminalBackground: 'oklch(0.12 0.015 280)',
        },
      },
      defaultProps: {
        overridesByLang: {
          bash: { frame: 'terminal' },
          shell: { frame: 'terminal' },
        },
      },
    }),
    mdx(),
    pagefind(),
    sitemap({
      customPages: ['https://ericcarlisle.com/design-system/lab/'],
      // Pathname-aware: exclude root /lab/* diagnostic routes, /posts/*
      // legacy redirects, and /portfolio/design-system/ (noindex), while
      // preserving /design-system/lab/ (Storybook) added via customPages.
      filter: (page) => {
        const pathname = new URL(page).pathname;
        return (
          !pathname.startsWith('/lab/') &&
          !pathname.startsWith('/posts/') &&
          !pathname.startsWith('/portfolio/design-system/')
        );
      },
    }),
  ],
  vite: {
    css: {
      transformer: 'postcss',
    },
    resolve: {
      alias: {
        '@styles': '/src/styles',
        '@images': '/src/assets/images',
        '@components': '/src/components',
        '@lib': '/src/lib',
      },
    },
  },
});
