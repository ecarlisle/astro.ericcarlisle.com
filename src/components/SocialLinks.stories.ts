import SocialLinks from './SocialLinks.astro';
import SocialLinksInFooterFixture from './story-fixtures/SocialLinksInFooterFixture.astro';
import SocialLinksInHeaderFixture from './story-fixtures/SocialLinksInHeaderFixture.astro';

const meta = {
  title: 'Components/SocialLinks',
  component: SocialLinks,
  parameters: {
    docs: {
      description: {
        component:
          'Social media link icons with inline SVG graphics. Includes GitHub, LinkedIn, Bluesky, and Mastodon links with accessible labels.',
      },
    },
  },
};

export default meta;

export const Default = {
  args: {},
};

export const InFooter = {
  component: SocialLinksInFooterFixture,
  args: {},
};

export const InHeader = {
  component: SocialLinksInHeaderFixture,
  args: {},
};
