import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

export default function (pi: ExtensionAPI) {
  // --- Startup widget ---

  pi.on('session_start', async (_event, ctx) => {
    ctx.ui.notify('AstroBlog context loaded', 'info');
    ctx.ui.setWidget('astroblog', [
      'Project: AstroBlog — Astro 7 SSG, vanilla CSS, MDX, pnpm, Biome',
      'Validation: pnpm typecheck | pnpm lint | pnpm build',
      'Agent instructions: AGENTS.md',
      'Design system: docs/design-system/',
    ]);
  });

  // --- Edit reminders (after successful edits only) ---

  pi.on('tool_result', async (event, ctx) => {
    if ((event.toolName === 'write' || event.toolName === 'edit') && !event.isError) {
      const path = event.input.path as string | undefined;
      if (!path) return;

      if (path.endsWith('.astro') || path.endsWith('.ts') || path.endsWith('.tsx')) {
        ctx.ui.setStatus('astroblog', 'Run pnpm typecheck');
      } else if (path.endsWith('.css')) {
        ctx.ui.setStatus('astroblog', 'Run pnpm lint');
      } else if (path.endsWith('.mdx') && path.startsWith('src/content/blog/')) {
        ctx.ui.setStatus('astroblog', 'Run pnpm typecheck (schema)');
      }
      // .md docs, .svg, .json, config files — no reminder needed
    }
  });
}
