/**
 * Site Intelligence MCP server.
 *
 * Local, read-only, stdio-transport MCP server exposing a single tool:
 * `get_site_overview` — a compact overview of the generated site inventory.
 */
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { getSiteOverviewToolHandler } from './tools/get-site-overview.js';

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
