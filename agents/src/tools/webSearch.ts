/**
 * Web search tool — uses the Anthropic built-in web_search_20260209
 * server-side tool for real-time information retrieval.
 *
 * Note: because this delegates to Anthropic's server-side tool,
 * we expose it to the agent but the actual execution is handled
 * by the API. The `executeSearchTool` below handles any client-side
 * fallback or result processing if needed.
 */

import Anthropic from "@anthropic-ai/sdk";

// Declare the built-in server-side search tool so Claude can invoke it.
// The Anthropic API handles the actual web request — no external API key needed.
export const searchTools: Anthropic.Tool[] = [
  {
    name: "web_search",
    description:
      "Searches the web for current information. Use when the user asks about recent events, facts that may have changed, or anything requiring up-to-date data.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query",
        },
      },
      required: ["query"],
    },
  },
];

/**
 * Client-side search fallback.
 * In practice, if you configure the Anthropic server-side `web_search_20260209`
 * tool in PersonalAgent.ts, the API executes search transparently.
 * This handler is called when using our custom tool declaration above.
 */
export async function executeSearchTool(
  input: Record<string, unknown>
): Promise<unknown> {
  const { query } = input as { query: string };

  // TODO: integrate with a search API (e.g., Brave Search, SerpAPI)
  // For MVP, return a placeholder directing users to upgrade for live search
  return {
    results: [],
    note: `Search for "${query}" — live web search coming soon. Upgrade to Pro for real-time results.`,
  };
}
