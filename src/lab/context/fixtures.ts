/**
 * Fixture data for the Context Lab.
 *
 * Deterministic sample data for the educational model. Tasks, documents,
 * relevance scores, authority assignments, and conflicts are manually
 * defined to illustrate how context-quality metrics behave.
 */
import type { LabDocument, LabPreset, LabTask } from './types';

export const TASKS: LabTask[] = [
  {
    id: 'a11y',
    title: 'Implement accessible navigation',
    description:
      'Add keyboard-navigation support, ARIA labels, focus management, and a skip link to a shared navigation component.',
    requirements: [
      'semantic-landmarks',
      'keyboard-navigation',
      'aria-labels',
      'focus-management',
      'skip-link',
    ],
  },
  {
    id: 'perf',
    title: 'Optimize page performance',
    description:
      'Reduce JavaScript bundle size, optimize images, configure font loading, and add lazy-loading for below-the-fold content.',
    requirements: [
      'bundle-optimization',
      'image-optimization',
      'font-loading',
      'lazy-loading',
      'css-minification',
    ],
  },
  {
    id: 'tokens',
    title: 'Style a card component',
    description:
      'Build a reusable card component using the existing design-token system for spacing, color, typography, and responsive layout.',
    requirements: [
      'spacing-tokens',
      'color-tokens',
      'typography-scale',
      'responsive-grid',
      'component-api',
    ],
  },
];

export const DOCUMENTS: LabDocument[] = [
  {
    id: 'doc-a11y-guidelines',
    title: 'Accessibility Guidelines',
    description: 'Current WCAG-aligned accessibility requirements for web applications.',
    authority: 'high',
    length: 3200,
    relevanceByTask: { a11y: 1.0, perf: 0.0, tokens: 0.0 },
    covers: ['semantic-landmarks', 'keyboard-navigation', 'aria-labels', 'skip-link'],
    authoritativeFor: ['semantic-landmarks', 'aria-labels', 'skip-link', 'keyboard-navigation'],
    conflictsWith: ['doc-legacy-a11y-notes'],
  },
  {
    id: 'doc-html-semantics',
    title: 'HTML Semantic Elements',
    description: 'Reference for semantic HTML elements and their accessible roles.',
    authority: 'high',
    length: 2400,
    relevanceByTask: { a11y: 0.9, perf: 0.0, tokens: 0.0 },
    covers: ['keyboard-navigation', 'focus-management'],
    authoritativeFor: ['keyboard-navigation', 'focus-management'],
    conflictsWith: ['doc-legacy-a11y-notes'],
  },
  {
    id: 'doc-perf-budget',
    title: 'Performance Budget Policy',
    description: 'Strict performance budgets and bundle-size thresholds for deployments.',
    authority: 'high',
    length: 2800,
    relevanceByTask: { a11y: 0.1, perf: 1.0, tokens: 0.0 },
    covers: ['bundle-optimization', 'image-optimization', 'font-loading', 'css-minification'],
    authoritativeFor: [
      'bundle-optimization',
      'image-optimization',
      'font-loading',
      'css-minification',
    ],
    conflictsWith: ['doc-legacy-perf-notes'],
  },
  {
    id: 'doc-tokens',
    title: 'Design Tokens Reference',
    description: 'CSS custom properties for color, typography, spacing, and layout.',
    authority: 'high',
    length: 1800,
    relevanceByTask: { a11y: 0.0, perf: 0.0, tokens: 1.0 },
    covers: ['spacing-tokens', 'color-tokens', 'typography-scale'],
    authoritativeFor: ['spacing-tokens', 'color-tokens', 'typography-scale'],
    conflictsWith: [],
  },
  {
    id: 'doc-components',
    title: 'Component Style Guide',
    description: 'Patterns and conventions for building reusable components.',
    authority: 'medium',
    length: 2600,
    relevanceByTask: { a11y: 0.2, perf: 0.2, tokens: 0.8 },
    covers: ['responsive-grid', 'component-api', 'spacing-tokens'],
    authoritativeFor: ['responsive-grid', 'component-api'],
    conflictsWith: [],
  },
  {
    id: 'doc-deploy',
    title: 'Deployment Workflow',
    description: 'CI/CD pipeline steps and release procedures.',
    authority: 'medium',
    length: 3200,
    relevanceByTask: { a11y: 0.0, perf: 0.1, tokens: 0.0 },
    covers: [],
    authoritativeFor: [],
    conflictsWith: [],
  },
  {
    id: 'doc-browser-compat',
    title: 'Browser Compatibility Notes',
    description: 'Pragmatic browser workarounds and polyfill recommendations.',
    authority: 'medium',
    length: 2000,
    relevanceByTask: { a11y: 0.0, perf: 0.6, tokens: 0.0 },
    covers: ['image-optimization', 'lazy-loading'],
    authoritativeFor: ['lazy-loading'],
    conflictsWith: [],
  },
  {
    id: 'doc-review-checklist',
    title: 'Code Review Checklist',
    description: 'General code-review criteria for style, correctness, and conventions.',
    authority: 'low',
    length: 1500,
    relevanceByTask: { a11y: 0.0, perf: 0.0, tokens: 0.0 },
    covers: [],
    authoritativeFor: [],
    conflictsWith: [],
  },
  {
    id: 'doc-legacy-a11y-notes',
    title: 'Outdated Frontend Accessibility Notes',
    description:
      'Earlier accessibility recommendations superseded by modern WCAG guidance. Some approaches conflict with current standards.',
    authority: 'medium',
    length: 2200,
    relevanceByTask: { a11y: 0.5, perf: 0.0, tokens: 0.0 },
    covers: ['keyboard-navigation', 'aria-labels'],
    authoritativeFor: ['keyboard-navigation'],
    conflictsWith: ['doc-a11y-guidelines', 'doc-html-semantics'],
  },
  {
    id: 'doc-legacy-perf-notes',
    title: 'Legacy Performance Optimization Notes',
    description:
      'Older performance recommendations that predate modern bundling and lazy-loading patterns. Some advice is still directionally correct but no longer state of the art.',
    authority: 'medium',
    length: 2000,
    relevanceByTask: { a11y: 0.0, perf: 0.5, tokens: 0.0 },
    covers: ['bundle-optimization', 'image-optimization'],
    authoritativeFor: ['bundle-optimization'],
    conflictsWith: ['doc-perf-budget'],
  },
];

export const PRESETS: LabPreset[] = [
  {
    id: 'minimal',
    label: 'Minimal',
    description:
      'The smallest selection — omits some useful or required context. Demonstrates how missing documents lower recall and sufficiency.',
    docIdsByTask: {
      a11y: ['doc-a11y-guidelines', 'doc-tokens'],
      perf: ['doc-perf-budget', 'doc-tokens'],
      tokens: ['doc-tokens'],
    },
  },
  {
    id: 'curated',
    label: 'Curated',
    description:
      'The smallest defensible set of relevant, authoritative documents. No unresolved competing guidance — every requirement has a clear authoritative source.',
    docIdsByTask: {
      a11y: ['doc-a11y-guidelines', 'doc-html-semantics'],
      perf: ['doc-perf-budget', 'doc-browser-compat'],
      tokens: ['doc-tokens', 'doc-components'],
    },
  },
  {
    id: 'overloaded',
    label: 'Overloaded',
    description:
      'Every available document regardless of relevance or staleness. Maximizes recall at the cost of precision and authority clarity.',
    docIdsByTask: {
      a11y: [
        'doc-a11y-guidelines',
        'doc-html-semantics',
        'doc-perf-budget',
        'doc-tokens',
        'doc-components',
        'doc-deploy',
        'doc-browser-compat',
        'doc-review-checklist',
        'doc-legacy-a11y-notes',
        'doc-legacy-perf-notes',
      ],
      perf: [
        'doc-a11y-guidelines',
        'doc-html-semantics',
        'doc-perf-budget',
        'doc-tokens',
        'doc-components',
        'doc-deploy',
        'doc-browser-compat',
        'doc-review-checklist',
        'doc-legacy-a11y-notes',
        'doc-legacy-perf-notes',
      ],
      tokens: [
        'doc-a11y-guidelines',
        'doc-html-semantics',
        'doc-perf-budget',
        'doc-tokens',
        'doc-components',
        'doc-deploy',
        'doc-browser-compat',
        'doc-review-checklist',
        'doc-legacy-a11y-notes',
        'doc-legacy-perf-notes',
      ],
    },
  },
];

/** Relevance score threshold for binary relevance classification. */
export const RELEVANCE_THRESHOLD = 0.6;

export const AUTHORITY_WEIGHTS: Record<string, number> = {
  high: 1.0,
  medium: 0.6,
  low: 0.3,
};

/** Characters per token approximation (plain English prose). */
export const CHARS_PER_TOKEN = 4;
