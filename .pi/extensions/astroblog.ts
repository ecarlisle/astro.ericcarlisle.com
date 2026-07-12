import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { Type } from 'typebox';

export default function (pi: ExtensionAPI) {
  pi.registerCommand('dev', {
    description: 'Start the Astro dev server at localhost:4321',
    handler: async (_args, ctx) => {
      await ctx.waitForIdle();
      ctx.ui.notify('Run: pnpm dev', 'info');
    },
  });

  pi.registerCommand('build', {
    description: 'Production build → dist/ (includes Pagefind indexing)',
    handler: async (_args, ctx) => {
      await ctx.waitForIdle();
      ctx.ui.notify('Run: pnpm build', 'info');
    },
  });

  pi.registerCommand('preview', {
    description: 'Preview the production build locally',
    handler: async (_args, ctx) => {
      await ctx.waitForIdle();
      ctx.ui.notify('Run: pnpm preview', 'info');
    },
  });

  pi.registerCommand('typecheck', {
    description: 'Run astro check (TS + Astro diagnostics)',
    handler: async (_args, ctx) => {
      await ctx.waitForIdle();
      ctx.ui.notify('Run: pnpm typecheck', 'info');
    },
  });

  pi.registerCommand('lint', {
    description: 'Run Biome lint checks',
    handler: async (_args, ctx) => {
      await ctx.waitForIdle();
      ctx.ui.notify('Run: pnpm lint', 'info');
    },
  });

  pi.registerCommand('format', {
    description: 'Run Biome formatter',
    handler: async (_args, ctx) => {
      await ctx.waitForIdle();
      ctx.ui.notify('Run: pnpm format', 'info');
    },
  });

  pi.registerCommand('lighthouse', {
    description: 'Run full Lighthouse audit across all HTML pages',
    handler: async (_args, ctx) => {
      await ctx.waitForIdle();
      ctx.ui.notify('Run: pnpm lighthouse:all', 'info');
    },
  });

  pi.registerCommand('structured-data', {
    description: 'Build + validate JSON-LD output',
    handler: async (_args, ctx) => {
      await ctx.waitForIdle();
      ctx.ui.notify('Run: pnpm structured-data:report', 'info');
    },
  });

  pi.registerTool({
    name: 'astro_check',
    label: 'Astro Check',
    description:
      'Run `pnpm typecheck` (TS + Astro diagnostics). Use after schema, component, or utility changes.',
    parameters: Type.Object({}),
    async execute() {
      return {
        content: [{ type: 'text', text: 'Run `pnpm typecheck` in the terminal.' }],
        details: {},
      };
    },
  });

  pi.registerTool({
    name: 'check_content_schema',
    label: 'Check Content Schema',
    description:
      'Validate blog frontmatter against src/content.config.ts. Use after adding or editing posts.',
    parameters: Type.Object({}),
    async execute() {
      return {
        content: [
          {
            type: 'text',
            text: 'Blog frontmatter schema is src/content.config.ts. description max 165 chars. pubDate uses z.coerce.date(). Run `pnpm typecheck` to validate.',
          },
        ],
        details: {},
      };
    },
  });

  pi.registerTool({
    name: 'preview_build',
    label: 'Preview Build',
    description: 'Preview the production build locally. Use after `pnpm build`.',
    parameters: Type.Object({}),
    async execute() {
      return {
        content: [
          {
            type: 'text',
            text: 'Run `pnpm build`, then `pnpm preview` to serve the dist/ output.',
          },
        ],
        details: {},
      };
    },
  });

  pi.registerTool({
    name: 'lighthouse_audit',
    label: 'Lighthouse Audit',
    description:
      'Run full Lighthouse audit. Use for performance, accessibility, SEO, or best-practices changes.',
    parameters: Type.Object({}),
    async execute() {
      return {
        content: [
          {
            type: 'text',
            text: 'Run `pnpm lighthouse:all`. Thresholds: performance ≥0.95, accessibility ≥0.95, SEO ≥1.0, best-practices ≥0.95.',
          },
        ],
        details: {},
      };
    },
  });

  pi.registerTool({
    name: 'structured_data_report',
    label: 'Structured Data Report',
    description: 'Build + validate JSON-LD output. Use for metadata or content route changes.',
    parameters: Type.Object({}),
    async execute() {
      return {
        content: [
          { type: 'text', text: 'Run `pnpm structured-data:report` to validate JSON-LD output.' },
        ],
        details: {},
      };
    },
  });

  pi.on('session_start', async (_event, ctx) => {
    ctx.ui.notify('AstroBlog context loaded ✓', 'info');
    ctx.ui.setWidget('astroblog', [
      'Commands: /dev /build /preview /typecheck /lint /format /lighthouse /structured-data',
      'Tools: astro_check, check_content_schema, preview_build, lighthouse_audit, structured_data_report',
      'Validate: typecheck | lint | build | lighthouse:all | structured-data:report',
    ]);
  });

  pi.on('tool_call', async (event, ctx) => {
    if (event.toolName === 'write' || event.toolName === 'edit') {
      const path = event.input.path as string | undefined;
      if (!path) return;
      if (path.endsWith('.astro') || path.endsWith('.ts') || path.endsWith('.tsx')) {
        ctx.ui.setStatus('astroblog', 'After edit: pnpm typecheck');
      } else if (path.endsWith('.css')) {
        ctx.ui.setStatus('astroblog', 'After edit: pnpm lint');
      } else if (path.endsWith('.md') || path.endsWith('.mdx')) {
        ctx.ui.setStatus('astroblog', 'After edit: pnpm typecheck (schema)');
      }
    }
  });

  pi.on('tool_result', async (event, ctx) => {
    if ((event.toolName === 'write' || event.toolName === 'edit') && !event.isError) {
      const path = event.input.path as string | undefined;
      if (!path) return;
      if (path.endsWith('.astro') || path.endsWith('.ts') || path.endsWith('.tsx')) {
        ctx.ui.notify('Run `pnpm typecheck` to verify TS/Astro changes.', 'info');
      } else if (path.endsWith('.css')) {
        ctx.ui.notify('Run `pnpm lint` to verify style changes.', 'info');
      } else if (path.endsWith('.md') || path.endsWith('.mdx')) {
        ctx.ui.notify('Run `pnpm typecheck` to validate frontmatter schema.', 'info');
      }
    }
  });
}
