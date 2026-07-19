import ThemeToggle from './ThemeToggle.astro';

const meta = {
  title: 'Components/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    docs: {
      description: {
        component:
          'Theme toggle button that switches between light and dark modes. Uses inline SVG icons and updates the `data-theme` attribute on the document element.',
      },
    },
  },
};

export default meta;

export const Default = {
  args: {},
};

export const InHeader = {
  args: {},
  decorators: [
    (Story: () => string) => `
      <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--bg-surface); border: 1px solid var(--border-main); border-radius: var(--radius-md);">
        <span style="color: var(--text-primary); font-weight: var(--font-weight-medium);">Site Title</span>
        <div style="margin-left: auto;">${Story()}</div>
      </div>
    `,
  ],
};
