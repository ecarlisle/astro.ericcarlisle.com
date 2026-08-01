# Site Intelligence MCP

A local, **read-only** [Model Context Protocol](https://modelcontextprotocol.io)
(MCP) server that exposes a compact overview of the generated
`ericcarlisle.com` site inventory to MCP-capable clients (e.g. Claude Desktop,
code editors with MCP support).

**Version 4 scope:** six read-only tools — `get_site_overview`,
`get_site_warnings`, `get_page`, `get_page_links`, `search_pages`, and
`get_related_pages` — over `stdio`. No network, no authentication, no write
access, no shell execution.

## Purpose

This is the first piece of a planned "Site Intelligence" system. It lets an
agent answer questions like *"How many pages does the site have, what categories
exist, are there any inventory warnings, and which pages are affected?"*
without crawling the repository or reading large JSON files — the data is
derived from the already-generated site inventory artifact.

## Architecture and data source

```text
site source or built output
        ↓
existing generator (scripts/generate-site-inventory.mjs, run by pnpm build's postbuild hook)
        ↓
validated generated artifact: dist/lab/site-inventory/data.json
        ↓
@ericcarlisle/site-intelligence-mcp (this package)
        ↓
local MCP client (stdio)
```

The server reads `dist/lab/site-inventory/data.json` — the same artifact the
`/lab/site-inventory/` page uses. It does **not** crawl the repository on every
tool call.

## Current scope

- **Tools:** `get_site_overview`, `get_site_warnings`, `get_page`,
  `get_page_links`, `search_pages`, and `get_related_pages`.
  - `get_site_overview` returns a compact structured overview: source artifact,
    generated commit, indexed-page counts, sitemap/orphan/warning totals, route
    categories, and warning codes.
  - `get_site_warnings` returns the individual warning records already present
    in the inventory: one entry per warning with its code, route, page title,
    and message, plus a total count and the generated commit.
  - `get_page` returns selected page metadata, build state, headings, and warnings for a single route.
  - `get_page_links` returns incoming and outgoing internal route relationships
    for a single page, with counts and an orphaned flag.
  - `search_pages` searches the inventory for pages matching a query string and
    returns a ranked list of matching pages with scores.
  - `get_related_pages` returns a ranked list of pages related to a given
    route, scored from inventory-backed signals (link graph, shared tokens,
    classification) with deterministic reasons for each match.
- **Transport:** local `stdio` only.
- **Permissions:** read-only. No filesystem-write, shell, Git, or network
  operations are performed.

## Tools

### get_site_overview

Returns a compact structured overview of the site inventory. See
[Current scope](#current-scope) above.

### get_site_warnings

Complements `get_site_overview()`: the overview reports warning **totals** and
codes, while this tool exposes the individual **warning records** so an agent
can see exactly which pages are affected and why.

Takes no arguments. Read-only. Uses the same validated inventory artifact and
path resolution as `get_site_overview`.

Example request:

```json
{
  "method": "tools/call",
  "params": {
    "name": "get_site_warnings",
    "arguments": {}
  }
}
```

Example response (text content, shown parsed):

```json
{
  "generatedCommit": "edac175",
  "warningCount": 2,
  "warnings": [
    {
      "code": "ORPHANED_PAGE",
      "route": "/tags/",
      "title": "Tags | Eric Carlisle",
      "message": "No internal links point to this page. It may be unreachable from navigation."
    },
    {
      "code": "NO_BUILT_PAGE",
      "route": "/design-system/lab/",
      "title": null,
      "message": "Sitemap references \"/design-system/lab/\" but no corresponding HTML file was generated."
    }
  ]
}
```

`warningCount` is always the length of `warnings`, so the two can never
disagree. Only fields backed by the generated inventory are returned: the
artifact records warnings with `code` and `message` (and pages carry `route`
and `title`), but it carries no per-warning severity and no generated-at
timestamp, so `severity` and `generatedAt` are intentionally **not** fabricated.

When the inventory is missing, malformed, or structurally invalid, the tool
returns a clear `Error:` message (no stack traces), matching
`get_site_overview`'s error behavior.

### get_page

Returns selected page metadata, build state, headings, and warnings for a single normalized route.

**Input:**

```json
{
  "route": "/tags/"
}
```

**Output (text content, shown parsed):**

```json
{
  "generatedCommit": "280bdc2",
  "page": {
    "route": "/tags/",
    "title": "Tags | Eric Carlisle",
    "description": "Browse all 5 topic tags across 3 posts.",
    "classification": "normal",
    "built": true,
    "inSitemap": true,
    "canonical": "https://ericcarlisle.com/tags/",
    "robots": "index, follow",
    "h1Count": 1,
    "h1Texts": ["Tags"],
    "redirectTarget": null,
    "inboundCount": 0,
    "warnings": [
      {
        "code": "ORPHANED_PAGE",
        "message": "No internal links point to this page. It may be unreachable from navigation."
      }
    ]
  }
}
```

**Route normalization:** The input `route` is normalized to the canonical
inventory format before lookup. The following variants all resolve to `/tags/`:

- `/tags/`
- `/tags`
- `tags/`
- `tags`
- `https://ericcarlisle.com/tags/`

Empty or whitespace-only input is rejected with a clear error. Unknown routes
return a clear `Error: Route "..." not found in site inventory.` message.
No fuzzy matching is performed.

### get_page_links

Returns incoming and outgoing internal route relationships for a single page.

**Input:**

```json
{
  "route": "/tags/"
}
```

**Output (text content, shown parsed):**

```json
{
  "generatedCommit": "280bdc2",
  "route": "/tags/",
  "incoming": [],
  "outgoing": [
    "/",
    "/about/",
    "/blog/",
    "/contact/",
    "/portfolio/site-quality/",
    "/search/",
    "/tags/3d-printing/",
    "/tags/ai-agents/",
    "/tags/ai/",
    "/tags/documentation/",
    "/tags/software-development/"
  ],
  "inboundCount": 0,
  "outgoingCount": 11,
  "orphaned": true
}
```

**Fields:**

- `incoming`: Sorted, deduplicated list of routes that link **to** this page.
- `outgoing`: Sorted, deduplicated list of routes this page links **to**.
- `inboundCount`: Length of `incoming` (matches the inventory's `inboundCount`).
- `outgoingCount`: Length of `outgoing`.
- `orphaned`: `true` when the page is an indexable, built, normal page with
  `inboundCount === 0` — matching the `ORPHANED_PAGE` warning semantics.

**Route normalization:** Same behavior as `get_page`. Empty, whitespace-only,
and unknown routes return clear errors.

### search_pages

Searches the site inventory for pages matching a query string. Returns a
ranked list of matching pages with scores.

**Purpose:**

Lets an agent discover relevant pages by topic before inspecting individual
pages with `get_page` or understanding connectivity with `get_page_links`.

**Input:**

```json
{
  "query": "context"
}
```

**Output (text content, shown parsed):**

```json
{
  "generatedCommit": "ef2d0e6",
  "query": "context",
  "resultCount": 2,
  "results": [
    {
      "route": "/lab/context/",
      "title": "Context Health: EricCarlisle.com",
      "description": "An experimental static assessment of coding-agent context readiness, with observed performance reported separately.",
      "classification": "lab",
      "score": 2800
    },
    {
      "route": "/blog/better-agent-results-start-with-better-context/",
      "title": "Better Agent Results Start With Better Context | Eric Carlisle",
      "description": "Better agent results depend on more than better prompts. They need carefully shaped context that makes project knowledge and developer judgment easier to follow.",
      "classification": "normal",
      "score": 2000
    }
  ]
}
```

**Fields searched:**

The search scores pages against the query using these inventory fields:

- `title`
- `route`
- `description`
- `h1Texts` (heading text)
- `classification`
- Tag extracted from route (e.g., `/tags/3d-printing/` → "3d-printing")

**Fields NOT searched:**

- Article body content (the full HTML body is not indexed)
- Repository source files (only the generated inventory artifact is used)
- Front-matter fields not listed above

**Scoring and ranking:**

Scores are cumulative. A page may receive points from multiple matching
fields and match types:

1. Exact title match: +1000
2. Exact route match: +900
3. Title prefix: +800
4. Route prefix: +700
5. Title substring (all query tokens present): +600
6. Description substring (all query tokens present): +500
7. Heading match (all query tokens present in `h1Texts`): +400
8. Tag match (query token matches tag from route): +300
9. Token match in individual fields (title, description, heading, route, classification): +25–200 each

A page matching multiple criteria accumulates points from each matching
signal, so result scores can exceed any single weight in the table above.

**Deterministic ordering:**

Results are sorted by:

1. Higher score first
2. Title alphabetically (case-insensitive)
3. Route alphabetically

No randomness, embeddings, or fuzzy spelling correction is used.

**Query normalization:**

- Leading/trailing whitespace trimmed
- Repeated whitespace collapsed to a single space
- Case folded to lowercase

**Empty and whitespace-only queries:**

Rejected with `Error: Query must be a non-empty string.`

**Non-string input:**

Rejected with `Error: Query must be a string.`

**Inventory fields:**

The search operates only on the generated inventory artifact at
`dist/lab/site-inventory/data.json`. It does not read source files or crawl
the repository.

### get_related_pages

Returns a ranked list of pages related to a given route, scored from
inventory-backed signals (link graph, shared tokens, classification) with a
deterministic `reasons` array explaining every match.

**Purpose:**

Lets an agent discover pages topically or structurally related to a page it
already cares about — e.g. "which pages connect to `/lab/context/`, share its
classification, or overlap with its vocabulary?" — without crawling the
repository or consulting an external knowledge source.

**Input:**

```json
{
  "route": "/lab/context/"
}
```

**Output (text content, shown parsed):**

```json
{
  "generatedCommit": "b5fc9a2",
  "route": "/lab/context/",
  "resultCount": 3,
  "results": [
    {
      "route": "/blog/better-agent-results-start-with-better-context/",
      "title": "Better Agent Results Start With Better Context | Eric Carlisle",
      "classification": "normal",
      "score": 350,
      "reasons": [
        "shared title token: context",
        "shared description token: context",
        "shared heading token: context"
      ]
    },
    {
      "route": "/lab/site-inventory/",
      "title": "Site Inventory — Eric Carlisle",
      "classification": "lab",
      "score": 200,
      "reasons": ["shared classification: lab"]
    },
    {
      "route": "/lab/youtube-facade-test/",
      "title": "YouTube Facade Test — Eric Carlisle",
      "classification": "lab",
      "score": 200,
      "reasons": ["shared classification: lab"]
    }
  ]
}
```

**Fields:**

- `route`: The normalized input route.
- `generatedCommit`: The commit the inventory artifact was generated from.
- `resultCount`: Number of results returned (bounded by the limit below).
- `results`: Ranked list, each with `route`, `title`, `classification`,
  `score`, and `reasons`.

**Signals (weights):**

Scores are cumulative. A page may receive points from multiple matching
signals, and each positive signal contributes an explanatory entry to
`reasons`:

1. Direct outgoing link (page links to the source route): +1000 — `linked directly`
2. Direct incoming link (page is linked from the source route): +1000 — `linked from this page`
3. Shared incoming neighbor (both pages are linked from the same route): +300 each, max 3 counted
4. Shared outgoing neighbor (both pages link to the same route): +300 each, max 3 counted
5. Shared classification: +50 for broad classes such as `normal`, +200 for distinctive classes such as `lab`
6. Shared tag from route (both under the same `/tags/<tag>/`): +200
7. Shared title token: +150 each
8. Shared description token: +100 each
9. Shared heading token (from `h1Texts`): +100 each

Token comparisons use the same normalization as `search_pages` (lowercase,
whitespace-collapsed). A page matching multiple signals accumulates points
from each, so result scores can exceed any single weight above.

**Shared-neighbor caps:**

The first 3 shared incoming neighbors and the first 3 shared outgoing
neighbors count toward the score (`maxSharedIncomingNeighbors` /
`maxSharedOutgoingNeighbors`). This keeps hub pages that share large parts of
the site navigation from dominating. The `reasons` entry always reports the
**actual** shared count (e.g. `10 shared outgoing neighbors`), even when only
3 of those neighbors contribute points.

**Stop-word filtering:**

Low-information English stop words are excluded from title, description, and
heading token matching, so words like `with`, `for`, and `the` do not create
unrelated matches. The excluded set also covers the repeated site-title
boilerplate (`eric`, `carlisle`) and drops punctuation-only tokens such as `|`
from the `| Eric Carlisle` title pattern. The stop-word set is centralized in
`RELATED_PAGES_STOP_WORDS`. No fuzzy matching, stemming, or language-model
logic is applied.

**Deterministic ordering:**

Results are sorted by:

1. Higher score first
2. Title alphabetically (case-insensitive)
3. Route alphabetically

Results are bounded to the top 5 by default (`RELATED_PAGES_LIMIT`). There is
no pagination or configuration. No randomness, embeddings, or LLM inference is
used — everything derives from the generated inventory artifact.

**Route normalization and errors:**

Same normalization and error behavior as `get_page`: variants such as
`/lab/context/`, `lab/context`, and `https://ericcarlisle.com/lab/context/` all
resolve to `/lab/context/`. Unknown routes return
`Error: Invalid route: Route "..." not found in site inventory.`; empty or
whitespace-only input returns `Error: Invalid route: Route must be a non-empty
string.`; non-string input is rejected by the tool schema; malformed absolute
URLs return `Error: Invalid route: Invalid absolute URL.`

## How to generate the underlying site data

```sh
pnpm build        # builds the site; the postbuild hook runs the inventory generator
# or, explicitly:
pnpm build && pnpm inventory:generate
```

The inventory artifact is written to `dist/lab/site-inventory/data.json`. The
generator now produces deterministic, sorted, deduplicated `incoming` and
`outgoing` route arrays for every page.

## How to run the MCP server

The server is launched in two phases so that build output never pollutes the
MCP protocol stream on stdout.

**1. Prepare** — build the site (regenerates the inventory artifact via the
postbuild hook) and build the MCP package:

```sh
pnpm mcp:site-intelligence:prepare
```

**2. Run** — start only the compiled server over `stdio`:

```sh
pnpm mcp:site-intelligence
```

The runtime command (`node packages/site-intelligence-mcp/dist/src/server.js`)
does not run pnpm, TypeScript, Astro, or the inventory generator, so its stdout
carries only MCP protocol messages. Point an MCP client directly at the
compiled entrypoint with `node`, not at the preparation command.

### Path resolution

The server resolves the inventory path in this order:

1. `SITE_INTELLIGENCE_INVENTORY_PATH` environment variable (absolute, or
   relative to the current working directory)
2. The repository root found by walking upward from the compiled module's
   own location (looking for `pnpm-workspace.yaml`), then
   `<repo>/dist/lab/site-inventory/data.json`. This is independent of the
   caller's cwd, so it works when an MCP client launches the server's
   absolute path with an unrelated working directory.
3. `<cwd>/dist/lab/site-inventory/data.json` as a convenience only when the
   repository-root walk cannot find a `pnpm-workspace.yaml` ancestor.

## Developer tooling: inspect and call tools manually

AI clients (Pi, Claude Desktop, editors) launch the MCP server automatically
from the local `.mcp.json` config (see
[Local MCP client configuration](#local-mcp-client-configuration)) and need
none of the commands below. The commands in this section are for local
development and debugging.

### Inspect with the MCP Inspector

Launch the official MCP Inspector web UI against the compiled local server:

```sh
pnpm mcp:site-intelligence:inspect
```

This starts the Inspector (a root `devDependency`, `@modelcontextprotocol/inspector`)
on `http://localhost:6274`, configured to connect to
`node packages/site-intelligence-mcp/dist/src/server.js` over stdio. From the
web UI you can list tools, inspect schemas, and invoke tools. The Inspector is
developer-only — it is never part of the server runtime.

### Call tools directly

`pnpm mcp:site-intelligence:call` spawns the compiled server over stdio and
talks to it through the official MCP TypeScript SDK client (it never imports
server implementation functions directly). Print available tools:

```sh
pnpm mcp:site-intelligence:call --list
```

Invoke a tool by name. Tools that require arguments accept a `--args` flag
with a JSON object:

```sh
pnpm mcp:site-intelligence:call get_site_overview
pnpm mcp:site-intelligence:call get_site_warnings
pnpm mcp:site-intelligence:call get_page --args '{"route":"/tags/"}'
pnpm mcp:site-intelligence:call get_page_links --args '{"route":"/tags/"}'
pnpm mcp:site-intelligence:call search_pages --args '{"query":"context"}'
pnpm mcp:site-intelligence:call get_related_pages --args '{"route":"/lab/context/"}'
```

The CLI prints the tool's text result and exits `0` on success; it exits
non-zero for unknown tools, usage errors, malformed JSON, non-object JSON,
and protocol failures. `pnpm mcp:site-intelligence:call --help` prints usage.

### Expected workflow

```sh
pnpm mcp:site-intelligence:prepare                    # build site inventory + MCP server/CLI
pnpm mcp:site-intelligence:inspect                    # interactive Inspector web UI
pnpm mcp:site-intelligence:call get_site_warnings     # one-off manual tool call
```

### Example agent workflow

An agent can explore the site inventory systematically:

1. **Call `get_site_overview`** to get a high-level summary (page counts,
   categories, warning totals).
2. **Call `get_site_warnings`** to see individual warning records and identify
   flagged routes.
3. **Call `search_pages`** to discover relevant pages by topic.
4. **Call `get_page`** for a discovered route to see its full metadata, build
   state, headings, and warnings.
5. **Call `get_related_pages`** for the same route to surface topically or
   structurally related pages, with reasons.
6. **Call `get_page_links`** for any interesting route to understand its
   connectivity — which pages link to it, which pages it links to, and whether
   it's orphaned.

Notes:

- `@modelcontextprotocol/inspector` is a root `devDependency`, used only by
  `mcp:site-intelligence:inspect`. pnpm reports that its `postinstall` script
  is not run — that script installs client sources for a fresh Inspector
  clone; the published package ships prebuilt clients, so skipping it is
  intentional and safe.
- The call CLI forwards its environment to the server, so
  `SITE_INTELLIGENCE_INVENTORY_PATH` overrides work as usual.
- The Inspector spawns the MCP server lazily when the browser connects; stop
  the Inspector with Ctrl-C when done.

## How to run the tests

```sh
pnpm test:mcp
# or, inside the package:
cd packages/site-intelligence-mcp && pnpm test
```

Tests use Node's built-in test runner (`node:test`) with temporary fixture
files. They are deterministic and require no MCP host or LLM.

## Local MCP client configuration

`.mcp.json` is intentionally **not** tracked: it contains developer-specific,
machine-specific configuration (absolute local paths). A portable template is
committed as `.mcp.example.json`.

To wire up an MCP client (Pi, Claude Desktop, editors):

1. Prepare the server and the generated inventory:

   ```sh
   pnpm mcp:site-intelligence:prepare
   ```

2. Copy the template to your local config:

   ```sh
   cp .mcp.example.json .mcp.json
   ```

3. Replace the `<REPOSITORY_ROOT>` placeholder with the absolute path to your
   local checkout:

   ```json
   {
     "mcpServers": {
       "site-intelligence": {
         "command": "node",
         "args": [
           "/absolute/path/to/astro.ericcarlisle.com/packages/site-intelligence-mcp/dist/src/server.js"
         ]
       }
     }
   }
   ```

4. Point your MCP client at that local `.mcp.json` (or copy the server entry
   into the client's own config, e.g. Claude Desktop's
   `claude_desktop_config.json`).

The compiled entrypoint and the `dist/lab/site-inventory/data.json` artifact
must exist before the client launches the server — run
`pnpm mcp:site-intelligence:prepare` first.

Because `.mcp.json` is git-ignored, it will not be committed accidentally;
changes you make to it are local to your machine.

## Security limitations

- The server trusts the generated inventory artifact. It does not validate
  that the artifact was produced by a trusted build.
- Errors intentionally avoid leaking stack traces or large file contents, but
  the artifact path appears in error messages.
- No authentication — any local process that can connect to the stdio pipe
  (i.e. the parent MCP client) can call the tool. Keep the client local and
  trusted.
- The only tool input is a site route string. No arbitrary filesystem paths,
  shell commands, or network destinations can be supplied.

## Explicitly deferred

- Graph refresh as an MCP tool
- Additional tools (metrics, etc.)
- Remote transports (HTTP/SSE)
- Authentication / authorization
- Graph database or SQLite persistence
- Publishing to a registry
- Docker packaging
- Live-network performance or Core Web Vitals (these are not measured by the
  inventory artifact)