import ThemeToggleInHeaderFixture from './ThemeToggleInHeaderFixture.astro';

const meta = {
  title: 'Components/ThemeToggle/In Header',
  component: ThemeToggleInHeaderFixture,
  parameters: {
    docs: {
      description: {
        component:
          'ThemeToggle rendered within a header bar. The surrounding context uses production spacing and border tokens.',
      },
    },
  },
};

export default meta;

export const InHeader = {};
