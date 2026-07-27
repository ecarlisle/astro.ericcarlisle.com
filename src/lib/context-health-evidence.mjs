export const GITHUB_REPOSITORY_URL = 'https://github.com/ecarlisle/astro.ericcarlisle.com';

const GIT_REVISION_PATTERN = /^[0-9a-f]{7,40}$/;

export function evidenceRevision(repositoryRevision) {
  return GIT_REVISION_PATTERN.test(repositoryRevision ?? '') ? repositoryRevision : 'main';
}

export function buildEvidenceUrl(repositoryRevision, citation) {
  validateCitationShape(citation);

  const revision = evidenceRevision(repositoryRevision);
  const encodedPath = citation.path.split('/').map(encodeURIComponent).join('/');
  const query = citation.startLine !== undefined && isMarkdownPath(citation.path) ? '?plain=1' : '';
  let fragment = '';
  if (citation.startLine !== undefined) {
    fragment = `#L${citation.startLine}`;
    if (citation.endLine !== undefined && citation.endLine !== citation.startLine) {
      fragment += `-L${citation.endLine}`;
    }
  } else if (citation.section !== undefined) {
    fragment = `#${githubHeadingAnchor(citation.section)}`;
  }

  const url = `${GITHUB_REPOSITORY_URL}/blob/${revision}/${encodedPath}${query}${fragment}`;
  const parsed = new URL(url);
  const expectedPrefix = `/ecarlisle/astro.ericcarlisle.com/blob/${revision}/`;
  if (
    parsed.protocol !== 'https:' ||
    parsed.hostname !== 'github.com' ||
    parsed.username ||
    parsed.password ||
    !parsed.pathname.startsWith(expectedPrefix) ||
    parsed.search !== query ||
    parsed.hash !== fragment
  ) {
    throw new Error('generated evidence URL is unsafe or malformed');
  }

  return url;
}

export function evidenceLinkText(citation) {
  if (citation.startLine === undefined) {
    return citation.section === undefined
      ? citation.path
      : `${citation.path}, ${headingText(citation.section)}`;
  }
  if (citation.endLine === undefined || citation.endLine === citation.startLine) {
    return `${citation.path}, line ${citation.startLine}`;
  }
  return `${citation.path}, lines ${citation.startLine}–${citation.endLine}`;
}

export function githubHeadingAnchor(section) {
  const anchor = headingText(section)
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\p{Letter}\p{Number}\s_-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
  if (!anchor) throw new Error('section citation needs a stable Markdown heading');
  return anchor;
}

export function validateCitationShape(citation) {
  if (!citation?.path || !isSafeRepositoryPath(citation.path)) {
    throw new Error('citation needs a safe repository-relative path');
  }
  if (citation.section !== undefined && !citation.section.trim()) {
    throw new Error('citation section must not be empty');
  }
  if (citation.section !== undefined && citation.startLine === undefined) {
    if (!isMarkdownPath(citation.path)) {
      throw new Error('section citation without lines requires a Markdown file');
    }
    githubHeadingAnchor(citation.section);
  }
  if (citation.startLine !== undefined && !isPositiveInteger(citation.startLine)) {
    throw new Error('citation startLine must be a positive integer');
  }
  if (citation.endLine !== undefined && !isPositiveInteger(citation.endLine)) {
    throw new Error('citation endLine must be a positive integer');
  }
  if (citation.endLine !== undefined && citation.startLine === undefined) {
    throw new Error('citation endLine requires startLine');
  }
  if (
    citation.startLine !== undefined &&
    citation.endLine !== undefined &&
    citation.endLine < citation.startLine
  ) {
    throw new Error('citation line range must not be reversed');
  }
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function headingText(section) {
  const match = section.trim().match(/^#{1,6}\s+(.+)$/);
  if (!match) throw new Error('section citation needs a stable Markdown heading');
  return match[1].trim();
}

function isMarkdownPath(path) {
  return /\.(?:md|mdx|markdown)$/i.test(path);
}

function isSafeRepositoryPath(path) {
  if (
    typeof path !== 'string' ||
    path.startsWith('/') ||
    path.includes('\\') ||
    path.includes('?') ||
    path.includes('#') ||
    [...path].some((character) => character.codePointAt(0) <= 31)
  ) {
    return false;
  }
  const segments = path.split('/');
  return segments.every((segment) => segment && segment !== '.' && segment !== '..');
}
