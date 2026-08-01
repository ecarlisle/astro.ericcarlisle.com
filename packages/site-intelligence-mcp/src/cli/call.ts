#!/usr/bin/env node
/**
 * Developer CLI for the Site Intelligence MCP server.
 *
 * Launches the compiled local server over stdio and talks to it through the
 * official MCP TypeScript SDK client — it never imports or calls server
 * implementation functions directly. Intended for manual inspection and
 * debugging; AI clients keep launching the MCP server themselves.
 *
 * Usage:
 *   pnpm mcp:site-intelligence:call --list
 *   pnpm mcp:site-intelligence:call <tool-name>
 *   pnpm mcp:site-intelligence:call <tool-name> --args '{"route":"/tags/"}'
 */
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';

/** Compiled server entry, relative to this CLI's own compiled location. */
const SERVER_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'server.js');

const USAGE = `Usage:
  pnpm mcp:site-intelligence:call --list
  pnpm mcp:site-intelligence:call <tool-name> [--args '<json>']

Options:
  --list          List available tools
  --args '<json>' JSON object with tool arguments (required for get_page, get_page_links, search_pages, get_related_pages)
  -h, --help      Show this help

Run \`pnpm mcp:site-intelligence:prepare\` first to build the server and CLI.

Examples:
  pnpm mcp:site-intelligence:call --list
  pnpm mcp:site-intelligence:call get_site_overview
  pnpm mcp:site-intelligence:call get_site_warnings
  pnpm mcp:site-intelligence:call get_page --args '{"route":"/tags/"}'
  pnpm mcp:site-intelligence:call get_page_links --args '{"route":"/tags/"}'
  pnpm mcp:site-intelligence:call search_pages --args '{"query":"context"}'
  pnpm mcp:site-intelligence:call get_related_pages --args '{"route":"/lab/context/"}'`;

function inheritableEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) env[key] = value;
  }
  return env;
}

function printToolResult(result: CallToolResult): boolean {
  const text = result.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
  if (text !== '') {
    process.stdout.write(`${text}\n`);
  } else {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }
  return result.isError === true;
}

function parseArgs(rawArgs: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawArgs);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON in --args: ${message}`);
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('--args must be a JSON object.');
  }
  return parsed as Record<string, unknown>;
}

async function main(): Promise<number> {
  const args = process.argv.slice(2);

  // Parse flags
  let toolName: string | undefined;
  let argsJson: string | undefined;
  let showHelp = false;
  let showList = false;
  let positionalCount = 0;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;
    if (arg === '-h' || arg === '--help') {
      showHelp = true;
    } else if (arg === '--list') {
      showList = true;
    } else if (arg === '--args') {
      if (i + 1 >= args.length) {
        process.stderr.write('Error: --args requires a JSON string.\n');
        return 2;
      }
      argsJson = args[i + 1];
      i++;
    } else if (!arg.startsWith('-')) {
      positionalCount++;
      if (positionalCount > 1) {
        process.stderr.write(`${USAGE}\n`);
        return 2;
      }
      toolName = arg;
    } else {
      process.stderr.write(`Error: Unknown option "${arg}".\n`);
      return 2;
    }
  }

  if (showHelp) {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }

  if (!toolName && !showList) {
    process.stderr.write(`${USAGE}\n`);
    return 2;
  }

  if (!existsSync(SERVER_PATH)) {
    process.stderr.write(
      `Compiled MCP server not found at "${SERVER_PATH}".\n` +
        'Run `pnpm mcp:site-intelligence:prepare` first.\n',
    );
    return 1;
  }

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [SERVER_PATH],
    env: inheritableEnv(),
    stderr: 'inherit',
  });
  const client = new Client({
    name: 'site-intelligence-call',
    version: '0.1.0',
  });

  let exitCode = 0;
  try {
    await client.connect(transport);
    const { tools } = await client.listTools();

    if (showList) {
      for (const tool of tools) {
        process.stdout.write(`${tool.name}\n`);
        if (tool.description) {
          process.stdout.write(`  ${tool.description}\n`);
        }
      }
      return 0;
    }

    const known = tools.some((tool) => tool.name === toolName);
    if (!known) {
      const available = tools.map((tool) => tool.name).join(', ');
      process.stderr.write(`Unknown tool "${toolName}".\nAvailable tools: ${available}\n`);
      return 1;
    }

    if (!toolName) {
      process.stderr.write('Error: No tool name provided.\n');
      return 2;
    }

    // Parse --args if provided
    let toolArgs: Record<string, unknown> = {};
    if (argsJson !== undefined) {
      try {
        toolArgs = parseArgs(argsJson);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(`Error: ${message}\n`);
        return 1;
      }
    }

    const raw = await client.callTool(
      { name: toolName, arguments: toolArgs },
      CallToolResultSchema,
    );

    // The SDK types callTool as a union of the modern content shape and the
    // legacy (2024-10-07) toolResult shape. Both members carry an index
    // signature, so the union cannot be narrowed by `in` — guard the shape at
    // runtime, then treat the modern shape as the result: this SDK server
    // always answers with it.
    if (!('content' in raw) || !Array.isArray(raw.content)) {
      process.stderr.write(`Unexpected tool result shape: ${JSON.stringify(raw, null, 2)}\n`);
      exitCode = 1;
    } else {
      if (printToolResult(raw as CallToolResult)) {
        exitCode = 1;
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error: ${message}\n`);
    exitCode = 1;
  } finally {
    try {
      await client.close();
    } catch {
      // Connection may already be closed after an error.
    }
    try {
      await transport.close();
    } catch {
      // Child process may already have exited.
    }
  }

  return exitCode;
}

main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    process.stderr.write(`Error: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
