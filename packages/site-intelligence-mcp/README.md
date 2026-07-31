# Site Intelligence MCP

A local, **read-only** [Model Context Protocol](https://modelcontextprotocol.io)
(MCP) server that exposes a compact overview of the generated
`ericcarlisle.com` site inventory to MCP-capable clients (e.g. Claude Desktop,
code editors with MCP support).

**Version 2 scope:** two read-only tools — `get_site_overview` and
`get_site_warnings` — over `stdio`. No network, no authentication, no write
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

- **Tools:** `get_site_overview` and `get_site_warnings`.
  - `get_site_overview` returns a compact structured overview: source artifact,
    generated commit, indexed-page counts, sitemap/orphan/warning totals, route
    categories, and warning codes.
  - `get_site_warnings` returns the individual warning records already present
    in the inventory: one entry per warning with its code, route, page title,
    and message, plus a total count and the generated commit.
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

## How to generate the underlying site data

```sh
pnpm build        # builds the site; the postbuild hook runs the inventory generator
# or, explicitly:
pnpm build && pnpm inventory:generate
```

The inventory artifact is written to `dist/lab/site-inventory/data.json`.

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

## How to run the tests

```sh
pnpm test:mcp
# or, inside the package:
cd packages/site-intelligence-mcp && pnpm test
```

Tests use Node's built-in test runner (`node:test`) with temporary fixture
files. They are deterministic and require no MCP host or LLM.

## Example local MCP client configuration

Claude Desktop (`claude_desktop_config.json`):

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

Run `pnpm mcp:site-intelligence:prepare` first so the compiled entrypoint and
the `dist/lab/site-inventory/data.json` artifact exist before the client
launches the server.
```

## Security limitations

- The server trusts the generated inventory artifact. It does not validate
  that the artifact was produced by a trusted build.
- Errors intentionally avoid leaking stack traces or large file contents, but
  the artifact path appears in error messages.
- No authentication — any local process that can connect to the stdio pipe
  (i.e. the parent MCP client) can call the tool. Keep the client local and
  trusted.
- The tool has no arguments, so no injection surface from tool inputs.

## Explicitly deferred

- Graph refresh as an MCP tool
- Additional tools (page lookup, metrics, etc.)
- Remote transports (HTTP/SSE)
- Authentication / authorization
- Graph database or SQLite persistence
- Publishing to a registry
- Docker packaging
- Live-network performance or Core Web Vitals (these are not measured by the
  inventory artifact)
