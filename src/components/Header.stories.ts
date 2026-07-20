import HeaderDefaultFixture from './story-fixtures/HeaderDefaultFixture.astro';

const meta = {
  title: 'Navigation/Header',
  component: HeaderDefaultFixture,
  parameters: {
    docs: {
      description: {
        component:
          'Site header with navigation links, search, theme toggle, and social links. The header is fixed to the top of the viewport and hides on scroll down. Navigation link active-state detection depends on Astro.url and will not highlight in Storybook.',
      },
    },
  },
};

export default meta;

export const Default = {
  args: {},
};

export const NarrowViewport = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
