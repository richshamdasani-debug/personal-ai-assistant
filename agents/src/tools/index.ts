/**
 * Tool registry — all tools available to the agent.
 * Add new tools here and implement them in their own file.
 */

import Anthropic from "@anthropic-ai/sdk";
import { memoryTools, executeMemoryTool } from "./memory.js";
import { searchTools, executeSearchTool } from "./webSearch.js";

export type ToolName =
  | "memory_store"
  | "memory_retrieve"
  | "web_search"
  | "get_current_time";

export const ALL_TOOLS: Anthropic.Tool[] = [
  ...memoryTools,
  ...searchTools,
  {
    name: "get_current_time",
    description: "Returns the current date and time. Use when the user asks about the current time or date.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

interface ToolContext {
  userId: string;
}

export async function executeTool(
  name: ToolName,
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<unknown> {
  switch (name) {
    case "memory_store":
    case "memory_retrieve":
      return executeMemoryTool(name, input, ctx.userId);

    case "web_search":
      return executeSearchTool(input);

    case "get_current_time":
      return {
        datetime: new Date().toLocaleString("en-US", { timeZoneName: "short" }),
        iso: new Date().toISOString(),
      };

    default:
      throw new Error(`Unknown tool: ${name as string}`);
  }
}
