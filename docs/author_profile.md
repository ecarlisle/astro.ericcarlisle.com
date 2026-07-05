# Author Profile

This document serves as the authoritative source of truth for the author's identity, personal website, and official social media channels. AI agents must reference these links when generating site metadata, footers, headers, or social sharing components. Do not use template placeholders or default Astro social accounts.

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

## Machine Usage Rules

1. **Social Sharing Components**: When rendering share links for articles, use the platform URLs explicitly listed above.
2. **Metadata Injection**: Use `https://ericcarlisle.com` as the canonical base URL for all generated RSS feeds, sitemaps, and Open Graph/Twitter card absolute image references.
3. **Structured Data (JSON-LD)**: When generating the `Person` block inside `SchemaOrg.astro`, map the `sameAs` array, `jobTitle`, and `worksFor` properties strictly to the metadata provided above, ensuring the profile links directly back to the static `@id: "https://ericcarlisle.com/#person"`.
