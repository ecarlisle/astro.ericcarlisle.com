import type { StorybookConfig } from '@storybook-astro/framework';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(ts|tsx|js|jsx|mdx)',
    '../src/components/story-fixtures/*.stories.@(ts|tsx|js|jsx|mdx)',
  ],
  addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
  framework: {
    name: '@storybook-astro/framework',
    options: {},
  },
  docs: {
    autodocs: true,
  },
  staticDirs: ['../public'],
  typescript: {
    reactDocgen: false,
  },
  viteFinal: async (config) => {
    return {
      ...config,
      base: '/design-system/lab/',
    };
  },
};

export default config;
