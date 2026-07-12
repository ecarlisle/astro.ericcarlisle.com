# Author Profile

This document is the authoritative source of truth for the author's identity, personal website, and official social media channels. Site metadata, footers, headers, and social sharing components should reference these links rather than template placeholders or default Astro social accounts.

## Identity & Biography

* **Full Name**: Eric Carlisle
* **Job Title**: Principal Full-Stack Engineer & UX Architect
* **Organization**: Eric Carlisle Consulting
* **Primary Domain**: https://ericcarlisle.com
* **Avatar Image Asset**: https://ericcarlisle.com/eric-carlisle.webp
* **Author Schema ID**: `https://ericcarlisle.com/#person`

## Verified Social Channels

| Platform | Official Profile URL |
| :--- | :--- |
| **Personal Website** | [ericcarlisle.com](https://ericcarlisle.com) |
| **GitHub** | [github.com/ecarlisle](https://github.com/ecarlisle) |
| **LinkedIn** | [linkedin.com/in/ericcarlisle](https://www.linkedin.com/in/ericcarlisle/) |
| **Bluesky** | [bsky.app/profile/ericcarlisle.bsky.social](https://bsky.app/profile/ericcarlisle.bsky.social) |
| **Mastodon** | [fosstodon.org/@ericcarlisle](https://fosstodon.org/@ericcarlisle) |

---

## Usage in Templates and Components

1. **Social Sharing Components**: Share links for articles should use the platform URLs listed above.
2. **Metadata Injection**: Use `https://ericcarlisle.com` as the canonical base URL for RSS feeds, sitemaps, and Open Graph/Twitter card absolute image references.
3. **Structured Data (JSON-LD)**: The `Person` block in `SchemaOrg.astro` maps the `sameAs` array, `jobTitle`, and `worksFor` properties to the metadata above, linking back to the static `@id: "https://ericcarlisle.com/#person"`.
