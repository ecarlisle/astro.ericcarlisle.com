# Site Intelligence MCP

A local, **read-only** [Model Context Protocol](https://modelcontextprotocol.io)
(MCP) server that exposes a compact overview of the generated
`ericcarlisle.com` site inventory to MCP-capable clients (e.g. Claude Desktop,
code editors with MCP support).

**Version 1 scope:** one tool, `get_site_overview`, over `stdio`. No network,
no authentication, no write access, no shell execution.

## Purpose

This is the first piece of a planned "Site Intelligence" system. It lets an
agent answer questions like *"How many pages does the site have, what categories
exist, and are there any inventory warnings?"* without crawling the repository
or reading large JSON files — the data is derived from the already-generated
site inventory artifact.

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

- **Tools:** `get_site_overview` only.
  Returns a compact structured overview: source artifact, generated commit,
  indexed-page counts, sitemap/orphan/warning totals, route categories, and
  warning codes.
- **Transport:** local `stdio` only.
- **Permissions:** read-only. No filesystem-write, shell, Git, or network
  operations are performed.

## How to generate the underlying site data

```sh
pnpm build        # builds the site; the postbuild hook runs the inventory generator
# or, explicitly:
pnpm build && pnpm inventory:generate
```

The inventory artifact is written to `dist/lab/site-inventory/data.json`.

## How to run the MCP server

```sh
pnpm mcp:site-intelligence
```

This builds the package and starts the server over `stdio`. Point an MCP client
at the underlying command, e.g.:

```sh
pnpm --filter @ericcarlisle/site-intelligence-mcp build
node packages/site-intelligence-mcp/dist/src/server.js
```

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
- Additional tools (page lookup, warnings detail, metrics, etc.)
- Remote transports (HTTP/SSE)
- Authentication / authorization
- Graph database or SQLite persistence
- Publishing to a registry
- Docker packaging
- Live-network performance or Core Web Vitals (these are not measured by the
  inventory artifact)
