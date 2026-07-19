import { AUTHOR_NAME } from '../consts';
import Card from './Card.astro';

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    docs: {
      description: {
        component:
          'Card component for displaying content summaries with optional images, metadata, and tags. Supports different heading levels and wrapper elements.',
      },
    },
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Card title',
    },
    href: {
      control: 'text',
      description: 'Link URL for the card',
    },
    author: {
      control: 'text',
      description: 'Author name',
    },
    pubDate: {
      control: 'date',
      description: 'Publication date',
    },
    tags: {
      control: 'object',
      description: 'Array of tag strings',
    },
    readingTime: {
      control: 'number',
      description: 'Reading time in words (200 words per minute)',
    },
    as: {
      control: 'select',
      options: ['div', 'article', 'li'],
      description: 'HTML wrapper element',
    },
    headingLevel: {
      control: 'select',
      options: ['h2', 'h3', 'h4'],
      description: 'Heading tag level',
    },
  },
};

export default meta;

export const Default = {
  args: {
    title: 'Building with Design Tokens',
    href: '#',
    author: AUTHOR_NAME,
    pubDate: new Date('2024-06-15'),
    readingTime: 400,
    slots: {
      default:
        '<p>Design tokens provide a shared vocabulary for design decisions across platforms and tools. They enable consistent theming and make design system changes easier to implement.</p>',
    },
  },
};

export const WithoutLink = {
  args: {
    title: 'Static Card Without Link',
    author: AUTHOR_NAME,
    pubDate: new Date('2024-06-15'),
    readingTime: 400,
    slots: {
      default:
        "<p>This card doesn't have a link, so the title is not clickable. Useful for display-only contexts.</p>",
    },
  },
};

export const WithTags = {
  args: {
    title: 'Article with Multiple Tags',
    href: '#',
    author: AUTHOR_NAME,
    pubDate: new Date('2024-06-15'),
    tags: ['Astro', 'CSS', 'Accessibility', 'Performance'],
    readingTime: 600,
    slots: {
      default:
        '<p>Tags help users discover related content. The card displays up to three tags, with the full list available in the tags array.</p>',
    },
  },
};

export const LongContent = {
  args: {
    title:
      'Understanding the Cascade: A Deep Dive into CSS Specificity and Inheritance in Modern Web Development',
    href: '#',
    author: AUTHOR_NAME,
    pubDate: new Date('2024-06-15'),
    readingTime: 2000,
    slots: {
      default:
        '<p>This card demonstrates how the component handles very long titles and content. The title should wrap gracefully, and the body text is truncated to three lines with an ellipsis to maintain visual consistency across card grids.</p>',
    },
  },
};

export const ArticleElement = {
  args: {
    title: 'Semantic Article Card',
    href: '#',
    as: 'article',
    author: AUTHOR_NAME,
    pubDate: new Date('2024-06-15'),
    readingTime: 400,
    slots: {
      default:
        '<p>This card uses an article element for better semantic meaning when used in article lists or blog indexes.</p>',
    },
  },
};

export const H3Heading = {
  args: {
    title: 'Card with H3 Heading',
    href: '#',
    headingLevel: 'h3',
    author: AUTHOR_NAME,
    pubDate: new Date('2024-06-15'),
    readingTime: 400,
    slots: {
      default:
        '<p>The heading level can be customized to fit the document outline. Use h3 for secondary card sections.</p>',
    },
  },
};
