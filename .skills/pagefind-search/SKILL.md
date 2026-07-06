# Pagefind Search Skill

Use this skill when implementing or modifying site search.

## Requirements

- Use Pagefind for static site search.
- Search should live at /search.
- Load Pagefind CSS and JavaScript only on the search page.
- Do not load search JavaScript globally.
- Use a simple header icon link to /search.
- The header search icon must be an anchor, not a button.
- The icon must have an accessible name.
- Exclude repeated layout UI from the search index.
- Index meaningful page, article, and portfolio content.

## Indexing Guidance

Index:

- Article bodies
- Portfolio case studies
- Main page content
- Titles and meaningful summaries

Do not index:

- Header
- Footer
- Navigation
- Social links
- Theme toggle
- Utility links
- Repeated share UI

## Verification

- Run the production build.
- Confirm Pagefind generates files in dist/pagefind.
- Confirm /search works in preview.
- Confirm the header search icon links to /search.
- Confirm Pagefind does not load on unrelated pages.
