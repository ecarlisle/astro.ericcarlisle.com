import SocialLinks from './SocialLinks.astro';

const meta = {
  title: 'Components/SocialLinks',
  component: SocialLinks,
  parameters: {
    docs: {
      description: {
        component:
          'Social media link icons with inline SVG graphics. Includes GitHub, LinkedIn, Twitter/X, and Mastodon links with accessible labels.',
      },
    },
  },
};

export default meta;

export const Default = {
  args: {},
};

export const InFooter = {
  args: {},
  decorators: [
    (Story: () => string) => `
      <footer style="padding: 2rem 1rem; background: var(--bg-surface); border-top: 1px solid var(--border-main); text-align: center;">
        <p style="color: var(--text-secondary); margin-bottom: 1rem;">© 2024 Eric Carlisle</p>
        <div style="display: flex; justify-content: center;">${Story()}</div>
      </footer>
    `,
  ],
};

export const InHeader = {
  args: {},
  decorators: [
    (Story: () => string) => `
      <header style="display: flex; align-items: center; padding: 1rem; background: var(--bg-surface); border-bottom: 1px solid var(--border-main);">
        <span style="color: var(--text-primary); font-weight: var(--font-weight-bold); font-size: var(--type-size-h4);">Site Title</span>
        <div style="margin-left: auto; display: flex; align-items: center; gap: 0.5rem;">${Story()}</div>
      </header>
    `,
  ],
};
