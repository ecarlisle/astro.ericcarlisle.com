# Graph Report - .  (2026-09-22)

## Corpus Check
- 130 files · ~190,898 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 420 nodes · 655 edges · 23 communities (19 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.81)
- Token cost: 284,409 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Blog Listing UI|Blog Listing UI]]
- [[_COMMUNITY_Agent Workflow & Site Policies|Agent Workflow & Site Policies]]
- [[_COMMUNITY_SEO & Structured Data|SEO & Structured Data]]
- [[_COMMUNITY_Navigation & Sharing Components|Navigation & Sharing Components]]
- [[_COMMUNITY_Architecture & Deployment Decisions|Architecture & Deployment Decisions]]
- [[_COMMUNITY_Design System & Agent Context|Design System & Agent Context]]
- [[_COMMUNITY_Graphify & Context Health Tooling|Graphify & Context Health Tooling]]
- [[_COMMUNITY_Context Health Audit Metrics|Context Health Audit Metrics]]
- [[_COMMUNITY_Lighthouse Performance Footer|Lighthouse Performance Footer]]
- [[_COMMUNITY_Context Health Evidence Validation|Context Health Evidence Validation]]
- [[_COMMUNITY_3D Model Viewer|3D Model Viewer]]
- [[_COMMUNITY_Contact Worker API|Contact Worker API]]
- [[_COMMUNITY_Card Component|Card Component]]
- [[_COMMUNITY_Social Links Component|Social Links Component]]
- [[_COMMUNITY_YouTube Embed Facade|YouTube Embed Facade]]
- [[_COMMUNITY_Site Quality Reporting|Site Quality Reporting]]
- [[_COMMUNITY_Header Storybook Stories|Header Storybook Stories]]
- [[_COMMUNITY_Heading Permalink Pattern|Heading Permalink Pattern]]
- [[_COMMUNITY_Color Foundations|Color Foundations]]
- [[_COMMUNITY_Spacing Foundations|Spacing Foundations]]
- [[_COMMUNITY_Typography Foundations|Typography Foundations]]

## God Nodes (most connected - your core abstractions)
1. `../layouts/BlogPost.astro` - 30 edges
2. `@components/BaseHead.astro` - 25 edges
3. `Architecture` - 22 edges
4. `@components/Footer.astro` - 18 edges
5. `Testing` - 15 edges
6. `@components/Header.astro` - 14 edges
7. `@lib/blog-utils` - 13 edges
8. `@lib/webmentions` - 13 edges
9. `getSortedPosts()` - 12 edges
10. `Context Health Core 0.1` - 12 edges

## Surprising Connections (you probably didn't know these)
- `Site Inventory and SEO Gate` --semantically_similar_to--> `Q: How can we fix it?`  [INFERRED] [semantically similar]
  docs/site-inventory.md → graphify-out/memory/query_20260821_190551_how_can_we_fix_it.md
- `Better Agent Results Start With Better Context` --semantically_similar_to--> `Agent Skills (.agents/skills/)`  [INFERRED] [semantically similar]
  src/content/blog/better-agent-results-start-with-better-context.mdx → docs/documentation.md
- `Architecture` --references--> `../layouts/BlogPost.astro`  [EXTRACTED]
  docs/architecture.md → src/layouts/BlogPost.astro
- `Static-First Astro Architecture Decision` --references--> `../layouts/BlogPost.astro`  [EXTRACTED]
  docs/decisions/001-static-first-astro-architecture.md → src/layouts/BlogPost.astro
- `Content Authoring` --references--> `getSortedPosts()`  [EXTRACTED]
  docs/content-authoring.md → src/lib/blog-utils.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Context Health Methodology Document Set** — docs_context_health_rubric, docs_context_health_metrics, docs_context_health_audit [EXTRACTED 1.00]
- **Architectural Decision Records** — docs_decisions_001_static_first_astro_architecture, docs_decisions_002_separate_cloudflare_worker_for_contact_form, docs_decisions_003_pagefind_for_static_site_search, docs_decisions_004_connected_schema_org_graph_for_structured_data [EXTRACTED 1.00]
- **Static Site and Contact Worker Deployment Surfaces** — docs_deployment_static_site, docs_deployment_contact_worker, docs_deployment_environment [EXTRACTED 1.00]
- **Deploy Blocked by Context Health Gate — Troubleshooting Flow** — graphify_out_memory_query_20260821_190123_teh_site_is_deployed_with_the_latest_changes__but, graphify_out_memory_query_20260821_190404_can_i_run_teh_build_and_deploy_on_the_current_main, graphify_out_memory_query_20260821_190551_how_can_we_fix_it, scripts_validate_context_health, concept_workflow [INFERRED 0.90]
- **Documentation Written for Both Humans and Agents** — docs_documentation, agents, concept_project_instruction_file, src_content_blog_better_agent_results_start_with_better_context [INFERRED 0.85]
- **KISS Design System Documentation Set** — docs_design_system_agent_guide, docs_design_system_figma_agent_brief, docs_design_system_icons, concept_kiss_design_system [INFERRED 0.85]

## Communities (23 total, 4 thin omitted)

### Community 0 - "Blog Listing UI"
Cohesion: 0.08
Nodes (35): @components/Header.astro, @components/PageHeader.astro, @components/PostGrid.astro, ../../components/TagFilterBar.astro, Default, LongTagLabels, ManyTags, meta (+27 more)

### Community 1 - "Agent Workflow & Site Policies"
Cohesion: 0.06
Nodes (42): Voice Profile (.agents/voice/profile.md), biome.json, Apache License 2.0, Good Article Shape, Indexing and Sitemap Policy, /lab/site-inventory/ Report Page, Material Icons (classic), Material Symbols (+34 more)

### Community 2 - "SEO & Structured Data"
Cohesion: 0.09
Nodes (29): pnpm structured-data:report, Author Profile, Author Person Identity, Connected Schema.org Graph for Structured Data Decision, JSON-LD Structured Data, @components/BaseHead.astro, canonicalURL, @components/FormattedDate.astro (+21 more)

### Community 3 - "Navigation & Sharing Components"
Cohesion: 0.05
Nodes (30): ../../components/HeaderLink.astro, pathname, subpath, ../../components/PaginationNav.astro, LongLabels, meta, NarrowContainer, NextOnly (+22 more)

### Community 4 - "Architecture & Deployment Decisions"
Cohesion: 0.08
Nodes (32): astro.config.mjs, contact-worker/wrangler.toml, Analytics and Monitoring, GA4 Analytics, Sentry Monitoring, Webmentions, Architecture, Generated Areas (+24 more)

### Community 5 - "Design System & Agent Context"
Cohesion: 0.09
Nodes (29): AGENTS.md, agent-context-and-documentation Model, AI (tag), AI Agents (tag), Codex (repo-aware coding agent), KISS Design System Figma File, Figma Known Gaps and Intentional Exceptions, Heading Permalinks Mechanism (+21 more)

### Community 6 - "Graphify & Context Health Tooling"
Cohesion: 0.10
Nodes (28): Build Job (CI), GitHub Pages Deployment, Graphify (Knowledge Graph Skill), pnpm context:health / context:health:validate, GitHub Actions Pages Workflow, Graphify, graphify-out/graph.json, Q: Site deployed with latest changes but tag colors/icons missing (+20 more)

### Community 7 - "Context Health Audit Metrics"
Cohesion: 0.09
Nodes (23): Context Health Evidence and Audits, Audit Procedure, Comparison and Regression Rules, Evidence Requirements, Profile Coverage, Context Health Metrics, Active Context Size, Authority Clarity (+15 more)

### Community 8 - "Lighthouse Performance Footer"
Cohesion: 0.15
Nodes (10): @components/Footer.astro, today, findPageData(), LighthousePageData, LighthousePageScores, LighthouseScoresFile, normalizeReportUrl(), normalizeRoute() (+2 more)

### Community 9 - "Context Health Evidence Validation"
Cohesion: 0.17
Nodes (15): ../../components/lab/ContextCheckCard.astro, buildEvidenceUrl(), evidenceLinkText(), evidenceRevision(), githubHeadingAnchor(), headingText(), isMarkdownPath(), isPositiveInteger() (+7 more)

### Community 10 - "3D Model Viewer"
Cohesion: 0.20
Nodes (4): 3D Printing (tag), StlViewerElement, 250mm Trading Card Box, a 3D Print, The "Why do I need all this USB & SD media?" Holder

### Community 11 - "Contact Worker API"
Cohesion: 0.26
Nodes (12): allFilled(), checkRateLimit(), ContactBody, Env, escapeHtml(), fetch(), json(), parseBody() (+4 more)

### Community 12 - "Card Component"
Cohesion: 0.14
Nodes (13): @components/Card.astro, {
  as: Tag = 'div',
  href,
  title,
  class: className,
  author,
  pubDate,
  tags,
  readingTime,
  index = 0,
  headingLevel: HeadingTag = 'h2',
}, dateDisplay, dateISO, hasFooter, hasImage, ArticleElement, Default (+5 more)

### Community 13 - "Social Links Component"
Cohesion: 0.17
Nodes (7): ../../components/SocialLinks.astro, Default, meta, InFooter, meta, InHeader, meta

### Community 14 - "YouTube Embed Facade"
Cohesion: 0.22
Nodes (3): YouTubeFacadeElement, MountOptions, MountResult

### Community 15 - "Site Quality Reporting"
Cohesion: 0.28
Nodes (4): ../../generated/site-quality.json, lighthousePath(), normalizeDisplayPath(), ../../lib/site-quality

### Community 16 - "Header Storybook Stories"
Cohesion: 0.40
Nodes (3): Default, meta, NarrowViewport

## Knowledge Gaps
- **181 isolated node(s):** `Env`, `ContactBody`, `rateLimitMap`, `$schema`, `title` (+176 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `../layouts/BlogPost.astro` connect `SEO & Structured Data` to `Blog Listing UI`, `Agent Workflow & Site Policies`, `Navigation & Sharing Components`, `Architecture & Deployment Decisions`, `Lighthouse Performance Footer`, `Site Quality Reporting`?**
  _High betweenness centrality (0.297) - this node is a cross-community bridge._
- **Why does `Architecture` connect `Architecture & Deployment Decisions` to `Agent Workflow & Site Policies`, `SEO & Structured Data`, `Design System & Agent Context`?**
  _High betweenness centrality (0.246) - this node is a cross-community bridge._
- **Why does `@components/BaseHead.astro` connect `SEO & Structured Data` to `Blog Listing UI`, `Context Health Evidence Validation`, `Architecture & Deployment Decisions`, `Lighthouse Performance Footer`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **What connects `Env`, `ContactBody`, `rateLimitMap` to the rest of the system?**
  _181 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Blog Listing UI` be split into smaller, more focused modules?**
  _Cohesion score 0.07922705314009662 - nodes in this community are weakly interconnected._
- **Should `Agent Workflow & Site Policies` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `SEO & Structured Data` be split into smaller, more focused modules?**
  _Cohesion score 0.09103840682788052 - nodes in this community are weakly interconnected._