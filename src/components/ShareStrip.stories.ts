import ShareStrip from '@ericcarlisle/design-system/components/ShareStrip.astro';

const meta = {
  title: 'Sharing/ShareStrip',
  component: ShareStrip,
  parameters: {
    docs: {
      description: {
        component:
          'Social sharing links for X/Twitter, LinkedIn, Mastodon, and Bluesky. Each link opens in a new tab with the article title and URL pre-populated.',
      },
    },
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Article title to include in share text',
    },
    pageUrl: {
      control: 'text',
      description: 'Full URL of the page to share',
    },
    enabled: {
      control: 'boolean',
      description: 'Toggle to enable or disable the share strip',
    },
  },
};

export default meta;

export const Default = {
  args: {
    title: 'Building with Design Tokens',
    pageUrl: 'https://ericcarlisle.com/blog/design-tokens',
  },
};

export const NarrowWidth = {
  args: {
    title: 'Building with Design Tokens',
    pageUrl: 'https://ericcarlisle.com/blog/design-tokens',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const LongTitle = {
  args: {
    title:
      'Understanding the Cascade: A Deep Dive into CSS Specificity and Inheritance in Modern Web Development',
    pageUrl: 'https://ericcarlisle.com/blog/css-cascade-deep-dive',
  },
};

export const LongUrl = {
  args: {
    title: 'Building with Design Tokens',
    pageUrl:
      'https://ericcarlisle.com/blog/a-very-long-url-that-demonstrates-what-happens-when-the-share-url-is-excessively-long-and-wraps-to-multiple-lines',
  },
};
