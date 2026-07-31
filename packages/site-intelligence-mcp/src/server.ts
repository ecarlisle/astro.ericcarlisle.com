/**
 * Site Intelligence MCP server.
 *
 * Local, read-only, stdio-transport MCP server exposing read-only tools over
 * the generated site inventory: `get_site_overview` (compact summary) and
 * `get_site_warnings` (individual warning records).
 */
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { getSiteOverviewToolHandler } from './tools/get-site-overview.js';
import { getSiteWarningsToolHandler } from './tools/get-site-warnings.js';

const SERVER_NAME = 'site-intelligence';
const SERVER_VERSION = '0.1.0';

export function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  server.registerTool(
    'get_site_overview',
    {
      title: 'Get site overview',
      description:
        'Return a compact, structured overview of the generated ericcarlisle.com site inventory: ' +
        'indexed page counts, route categories, warning totals, and source freshness. ' +
        'Read-only; no arguments.',
    },
    getSiteOverviewToolHandler,
  );

  server.registerTool(
    'get_site_warnings',
    {
      title: 'Get site warnings',
      description:
        'Return the individual warning records present in the generated ' +
        "ericcarlisle.com site inventory: each warning's code, route, page " +
        'title, and message, plus a total count and the generated commit. ' +
        'Read-only; no arguments.',
    },
    getSiteWarningsToolHandler,
  );

  return server;
}

export async function runServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Only start when executed directly (not when imported by tests).
const isDirectRun =
  process.argv[1] !== undefined && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isDirectRun) {
  runServer().catch((error: unknown) => {
    console.error('Failed to start site-intelligence MCP server:', error);
    process.exit(1);
  });
}
