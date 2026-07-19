import SocialLinksInHeaderFixture from './SocialLinksInHeaderFixture.astro';

const meta = {
  title: 'Components/SocialLinks/In Header',
  component: SocialLinksInHeaderFixture,
  parameters: {
    docs: {
      description: {
        component:
          'SocialLinks rendered within a header context. The header uses production spacing tokens, typography, and borders.',
      },
    },
  },
};

export default meta;

export const InHeader = {};
