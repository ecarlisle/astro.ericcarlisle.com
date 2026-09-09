// @ts-check

import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import expressiveCode from 'astro-expressive-code';
import pagefind from 'astro-pagefind';
import { excludeFromSitemap } from './scripts/seo-policy.mjs';

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
      // The @astrojs/sitemap integration discovers every static page it builds.
      // The shared SEO policy (scripts/seo-policy.mjs) decides inclusion:
      //   - excludes /search/ (noindex), single-entry /tags/* (noindex),
      //     /posts/* legacy redirects, /lab/* diagnostics, and the Storybook
      //     /design-system/lab/ application (noindex)
      //   - includes /portfolio/design-system/ (now indexable)
      filter: (page) => {
        const pathname = new URL(page).pathname;
        return !excludeFromSitemap(pathname);
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
