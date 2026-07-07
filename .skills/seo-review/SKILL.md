---
name: SEO Content Metadata
slug: seo-content-metadata
description: Use this skill when creating or editing pages, posts, images, links, structured data, or page metadata.
category: content
applies_to:
  - SEO
  - metadata
  - structured data
  - Open Graph
  - content
triggers:
  - SEO
  - metadata
  - title
  - description
  - structured data
  - Open Graph
priority: medium
version: 1
---
SEO Content Metadata Skill

Use this skill when creating or editing pages, posts, portfolio entries, case studies, images, internal links, or page metadata.

This skill applies practical SEO, social sharing, structured data, and content metadata checks. It is intended to improve clarity, discoverability, indexing quality, and share previews without keyword stuffing or misleading metadata.

Goal

Ensure each page accurately describes its content for humans, search engines, and social platforms. Prefer clear, useful, content-matching metadata over generic, duplicated, or over-optimized text.

Core Requirements

* Each indexable page must have a clear, unique title.
* Each important indexable page should have a useful meta description.
* Titles and descriptions must match the actual page content.
* Avoid duplicate titles and duplicate descriptions across important pages.
* Use canonical URLs when the project supports them.
* Use Open Graph metadata when the project supports it.
* Use social metadata when the project supports it.
* Use JSON-LD structured data when it accurately represents the page.
* Preserve semantic heading hierarchy.
* Use one clear h1 per page.
* Use descriptive link text.
* Prefer human-readable URLs.
* Do not stuff keywords.
* Do not add misleading metadata for content that is not present on the page.
* Do not block important pages from indexing unless intentionally requested.

Metadata Checks

Check that the page includes appropriate metadata for its type:

* Title
* Meta description
* Canonical URL
* Open Graph title
* Open Graph description
* Open Graph image
* Open Graph type
* Social/Twitter card metadata, if supported
* Author metadata, when relevant
* Published date, when relevant
* Modified date, when relevant
* Robots metadata, only when intentionally needed

For titles and descriptions:

* Confirm they are specific to the page.
* Confirm they are readable and human-centered.
* Confirm they summarize the actual content.
* Avoid generic titles such as “Home,” “Article,” “Portfolio,” or “Untitled.”
* Avoid repeating the same site-wide description on every page.
* Keep titles and descriptions concise enough to work well in search and social previews.

Content Checks

Check that the page content supports the metadata:

* The page has one clear h1.
* Headings follow a logical hierarchy.
* Portfolio and case study pages have meaningful summaries.
* Article pages have a clear topic, purpose, and introduction.
* Important pages include enough crawlable text to explain their value.
* Internal links use descriptive text.
* Related pages are linked where useful.
* Images that convey content have useful alt text.
* Decorative images use empty alt text where appropriate.
* Repeated layout chrome is not mistaken for the main content.
* Important content is not only present inside images, scripts, or inaccessible widgets.

Structured Data Checks

Use JSON-LD only when it accurately matches the visible page content.

Consider structured data for:

* Articles or blog posts
* Portfolio entries or case studies
* Breadcrumbs
* Person/profile information
* Organization/site identity
* WebSite metadata
* FAQ content, only when real FAQ content is visible on the page
* HowTo content, only when the page actually contains step-by-step instructions

When adding or reviewing JSON-LD:

* Use the most specific accurate schema type.
* Keep structured data consistent with visible content.
* Do not invent ratings, reviews, dates, authors, employers, services, or claims.
* Include canonical URLs where appropriate.
* Include image URLs when relevant and available.
* Validate that required and recommended fields are present for the chosen schema.
* Avoid adding structured data that creates false eligibility for rich results.

Rich Results Checks

When a page is intended to support Google rich results:

* Confirm the structured data type is eligible for the intended result.
* Confirm the page visibly contains the same information represented in JSON-LD.
* Confirm required fields are present.
* Confirm dates use valid ISO-style formats where appropriate.
* Confirm images meet project standards for quality, relevance, and shareability.
* Confirm breadcrumbs match the actual site structure.
* Do not mark up content solely to chase a rich result if it does not fit the page.

Social Preview Checks

When the page may be shared on social platforms:

* Confirm the Open Graph title is useful and page-specific.
* Confirm the Open Graph description is useful and page-specific.
* Confirm the Open Graph image exists and is appropriate for the page.
* Confirm the image has a reasonable aspect ratio for sharing.
* Confirm article, portfolio, and case study pages do not all reuse the same generic preview image unless intentional.
* Confirm social metadata does not contradict the page title or visible content.

URL and Indexing Checks

Check that URLs and indexing behavior are intentional:

* URLs are readable, stable, and lowercase where possible.
* URLs avoid unnecessary dates, IDs, query strings, or filler words unless needed.
* Canonical URLs point to the preferred version of the page.
* Draft, test, duplicate, search-result, or utility pages are not accidentally indexable.
* Important pages are not accidentally marked noindex.
* Internal links point to canonical page paths.

Fix Guidance

When fixing SEO or metadata issues:

1. Identify the affected page or component.
2. Explain the issue briefly.
3. Apply the smallest targeted fix.
4. Keep metadata accurate to the visible content.
5. Avoid broad rewrites unless the content itself does not support the page goal.
6. Verify the rendered metadata, not just the source component.

Verification

After making changes, verify:

* The rendered page has the expected title and description.
* The rendered page has one h1.
* Canonical metadata is correct.
* Open Graph and social metadata render correctly.
* JSON-LD is valid JSON and matches the visible content.
* Rich-result-oriented markup uses an eligible schema type.
* Images referenced in metadata resolve correctly.
* Important pages are indexable.
* Duplicate titles and descriptions were not introduced.

Output Format

When reporting findings, use this format:

### Issue: [short name]
**Where:** [page, component, route, or metadata field]
**Problem:** [brief explanation]
**Fix:** [specific recommendation or code change]
**Verify:** [rendered metadata, schema validation, heading check, preview check, or indexing check]
