const permalinkIcon = `
  <svg viewBox="0 0 24 24" width="1.05em" height="1.05em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>`;

const permalink = (id: string, label: string) => `
  <a class="permalink" href="#${id}" aria-label="Link to ${label}">${permalinkIcon}</a>`;

const demo = (
  id: string,
  level: 'h2' | 'h3',
  title: string,
  extraClass = '',
  permalinkClass = '',
) => `
  <div class="portfolio-title ${extraClass}">
    <${level} id="${id}">${title}</${level}><a class="permalink ${permalinkClass}" href="#${id}" aria-label="Link to ${title}">${permalinkIcon}</a>
  </div>`;

const meta = {
  title: 'Patterns/Heading Permalinks',
  component: `
    <style>
      /* Reproduces the canonical pattern from src/pages/portfolio.astro so the
         lab can render the same heading-permalink behavior in isolation. */
      .hp-wrap { display: flex; flex-direction: column; gap: 2rem; font-family: var(--font-copy, system-ui); }
      .hp-block { display: flex; flex-direction: column; gap: 1.5rem; padding: 1.5rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-lg); --color-link: var(--brand-primary); --color-link-hover: var(--brand-accent); --color-focus: var(--color-link); }
      .hp-block h2, .hp-block h3, .hp-block p { margin: 0; }
      .hp-label { font-size: var(--type-size-small); color: var(--text-muted); font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.05em; }
      .portfolio-title { display: block; }
      .portfolio-title h2, .portfolio-title h3 { display: inline; }
      .portfolio-title--wrapped { max-width: 30ch; }
      .permalink {
        display: inline-flex; align-items: center; justify-content: center;
        vertical-align: middle;
        min-width: var(--size-touch-target-min); min-height: var(--size-touch-target-min);
        border-radius: var(--radius-md); color: var(--color-link); opacity: 0.6;
        text-decoration: none; line-height: 0;
        transition: opacity var(--transition-fast), background-color var(--transition-fast), color var(--transition-fast);
      }
      .portfolio-title :is(h2, h3)::after { content: '\\00a0'; }
      .permalink svg { width: 1.05em; height: 1.05em; }
      .portfolio-title:hover .permalink, .permalink:hover, .permalink:focus-visible,
      .permalink.is-hover, .permalink.is-focus {
        opacity: 1; color: var(--color-link-hover); background-color: var(--bg-surface);
      }
      .permalink:focus-visible, .permalink.is-focus {
        outline: var(--size-border-pixel, 2px) dashed var(--color-focus); outline-offset: 3px;
      }
      .portfolio-title :is(h2, h3):target, .hp-target :is(h2, h3) {
        box-shadow: inset 3px 0 0 var(--brand-accent);
      }
    </style>
    <div class="hp-wrap">
      <section class="hp-block" data-theme="dark">
        <p class="hp-label">Default (dark theme)</p>
        ${demo('hp-h2', 'h2', 'Designing section landmarks')}
        ${demo('hp-h3', 'h3', 'Reengineering enterprise commerce performance')}
      </section>
      <section class="hp-block" data-theme="dark">
        <p class="hp-label">Hover / keyboard focus</p>
        ${demo('hp-h2-hover', 'h2', 'Hover state on the permalink', '', 'is-hover')}
        ${demo('hp-h3-focus', 'h3', 'Keyboard-focus state', '', 'is-focus')}
      </section>
      <section class="hp-block" data-theme="dark">
        <p class="hp-label">Targeted (fragment landing highlight)</p>
        <div class="hp-target">
          ${demo('hp-h3-target', 'h3', 'Reached via its own fragment URL')}
        </div>
      </section>
      <section class="hp-block" data-theme="dark">
        <p class="hp-label">Wrapped (icon stays on the final word)</p>
        ${demo('hp-h3-wrapped', 'h3', 'Building integration layers for product teams across many releases', 'portfolio-title--wrapped')}
      </section>
      <section class="hp-block" data-theme="light" style="background: var(--bg-main);">
        <p class="hp-label">Default (light theme)</p>
        ${demo('hp-h2-light', 'h2', 'Designing section landmarks')}
        ${demo('hp-h3-light', 'h3', 'Reengineering enterprise commerce performance')}
      </section>
    </div>
  `,
  parameters: {
    docs: {
      description: {
        component:
          "Heading Permalinks puts a visible chain-link anchor beside a content-section heading so it has a stable, shareable fragment URL. The permalink is a sibling `a.permalink` (never nested inside the heading's link or another anchor) whose `href` matches the heading's explicit, lowercase kebab-case `id`; the link icon is `aria-hidden` and the anchor carries `aria-label=\"Link to <Visible Title>\"`. Navigation is native fragment behavior — no clipboard and no runtime JavaScript. The heading and permalink share one inline text flow, bound by a trailing non-breaking space, so the icon stays on the title's final word and never orphans. `scroll-margin-top` clears the fixed header on landing; a restrained `:target` highlight marks the destination and becomes a static inset accent bar under `prefers-reduced-motion`. The 44px target, visible dashed `:focus-visible` ring, and semantic tokens keep it accessible and theme-aware. Canonical implementation: `src/pages/portfolio.astro`; live at `/portfolio/#kiss-design-system`.",
      },
    },
  },
};

export default meta;

export const HeadingPermalinks = {};
