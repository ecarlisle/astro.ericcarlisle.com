import PaginationNav from './PaginationNav.astro';

const meta = {
  title: 'Navigation/PaginationNav',
  component: PaginationNav,
  parameters: {
    docs: {
      description: {
        component:
          'Previous/next pagination navigation for blog post sequences. Displays previous and next links with labels and optional titles.',
      },
    },
  },
  argTypes: {
    prev: {
      control: 'object',
      description: 'Previous page link data: { url, label, title? }',
    },
    next: {
      control: 'object',
      description: 'Next page link data: { url, label, title? }',
    },
  },
};

export default meta;

export const PrevAndNext = {
  args: {
    prev: { url: '#', label: '← Previous', title: 'Building with Design Tokens' },
    next: { url: '#', label: 'Next →', title: 'Understanding CSS Cascade' },
  },
};

export const PreviousOnly = {
  args: {
    prev: { url: '#', label: '← Previous', title: 'Building with Design Tokens' },
    next: null,
  },
};

export const NextOnly = {
  args: {
    prev: null,
    next: { url: '#', label: 'Next →', title: 'Understanding CSS Cascade' },
  },
};

export const LongLabels = {
  args: {
    prev: {
      url: '#',
      label: '← Older post',
      title:
        'A Very Long Article Title That Demonstrates How Wrapping Works in the Pagination Component',
    },
    next: {
      url: '#',
      label: 'Newer post →',
      title: 'Another Article with an Excessively Long Title That Wraps Gracefully',
    },
  },
};

export const NarrowContainer = {
  args: {
    prev: { url: '#', label: '← Previous', title: 'Building with Design Tokens' },
    next: { url: '#', label: 'Next →', title: 'Understanding CSS Cascade' },
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
