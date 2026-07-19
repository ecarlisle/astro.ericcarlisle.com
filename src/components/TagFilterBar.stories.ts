import type { TagData } from '../lib/blog-utils';
import TagFilterBar from './TagFilterBar.astro';

const sampleTagData: TagData = {
  allTags: [
    'Astro',
    'CSS',
    'Accessibility',
    'Performance',
    'TypeScript',
    'React',
    'Design Systems',
  ],
  tagCounts: {
    Astro: 12,
    CSS: 8,
    Accessibility: 5,
    Performance: 3,
    TypeScript: 7,
    React: 4,
    'Design Systems': 6,
  },
};

const meta = {
  title: 'Navigation/TagFilterBar',
  component: TagFilterBar,
  parameters: {
    docs: {
      description: {
        component:
          'Tag filter bar for blog posts. Displays tag links with optional post counts for filtering or navigation.',
      },
    },
  },
  argTypes: {
    tagData: {
      control: 'object',
      description: 'Tag data with allTags array and tagCounts map',
    },
    tags: {
      control: 'object',
      description: 'Array of tag strings for inline tag display',
    },
  },
};

export default meta;

export const Default = {
  args: {
    tagData: sampleTagData,
  },
};

export const SingleTag = {
  args: {
    tagData: {
      allTags: ['Astro'],
      tagCounts: { Astro: 12 },
    },
  },
};

export const ManyTags = {
  args: {
    tagData: {
      allTags: [
        'Astro',
        'CSS',
        'Accessibility',
        'Performance',
        'TypeScript',
        'React',
        'Design Systems',
        'Animation',
        'GraphQL',
        'Testing',
        'SEO',
        'JavaScript',
        'Node.js',
        'CLI Tools',
        'Git',
      ],
      tagCounts: {
        Astro: 12,
        CSS: 8,
        Accessibility: 5,
        Performance: 3,
        TypeScript: 7,
        React: 4,
        'Design Systems': 6,
        Animation: 2,
        GraphQL: 3,
        Testing: 4,
        SEO: 2,
        JavaScript: 9,
        'Node.js': 3,
        'CLI Tools': 1,
        Git: 2,
      },
    },
  },
};

export const LongTagLabels = {
  args: {
    tagData: {
      allTags: ['Software Development', 'Frontend Architecture', 'Design Systems'],
      tagCounts: {
        'Software Development': 15,
        'Frontend Architecture': 8,
        'Design Systems': 6,
      },
    },
  },
};

export const NarrowViewport = {
  args: {
    tagData: sampleTagData,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
