import ThemeToggle from '@ericcarlisle/design-system/components/ThemeToggle.astro';

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
