export type CategoryAccent = 'blue' | 'violet' | 'plum' | 'coral' | 'slate' | 'moss';
export type CategoryIcon =
  | 'accessibility'
  | 'architecture'
  | 'performance'
  | 'strategy'
  | 'systems';

const categoryAccents: Record<string, CategoryAccent> = {
  '3d-printing': 'coral',
  accessibility: 'coral',
  ai: 'plum',
  'ai-agents': 'violet',
  all: 'slate',
  documentation: 'slate',
  'design systems': 'moss',
  'frontend architecture': 'blue',
  performance: 'slate',
  'software-development': 'blue',
  sustainability: 'moss',
  'ux strategy': 'violet',
};

const categoryIcons: Record<string, CategoryIcon> = {
  '3d-printing': 'architecture',
  accessibility: 'accessibility',
  ai: 'strategy',
  'ai-agents': 'systems',
  all: 'systems',
  documentation: 'strategy',
  'design systems': 'systems',
  'frontend architecture': 'architecture',
  performance: 'performance',
  'software-development': 'architecture',
  sustainability: 'systems',
  'ux strategy': 'strategy',
};

// Category accents are informational only; they never represent status or state.
const fallbackAccents: readonly CategoryAccent[] = [
  'blue',
  'violet',
  'plum',
  'coral',
  'slate',
  'moss',
];

const fallbackIcons: readonly CategoryIcon[] = [
  'architecture',
  'systems',
  'accessibility',
  'performance',
  'strategy',
];

function normalizeCategoryName(name: string): string {
  return name.trim().toLowerCase();
}

function stableCategoryIndex(name: string, itemCount: number): number {
  let hash = 0;

  for (const character of name) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash % itemCount;
}

export function getCategoryAccent(name: string): CategoryAccent {
  const normalizedName = normalizeCategoryName(name);

  return (
    categoryAccents[normalizedName] ??
    fallbackAccents[stableCategoryIndex(normalizedName, fallbackAccents.length)]
  );
}

export function getCategoryIcon(name: string): CategoryIcon {
  const normalizedName = normalizeCategoryName(name);

  return (
    categoryIcons[normalizedName] ??
    fallbackIcons[stableCategoryIndex(normalizedName, fallbackIcons.length)]
  );
}
