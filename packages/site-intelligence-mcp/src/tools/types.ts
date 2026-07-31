/**
 * Shared types for site-intelligence MCP tool handlers.
 */

/** Standard content result returned by every tool handler. */
export type ToolContentResult = {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
};
