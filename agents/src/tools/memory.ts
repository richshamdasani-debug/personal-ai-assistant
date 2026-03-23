/**
 * Memory tools — let the agent store and retrieve facts about the user.
 * Backed by Supabase for persistence across container restarts.
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export const memoryTools: Anthropic.Tool[] = [
  {
    name: "memory_store",
    description:
      "Stores a fact or piece of information about the user for future reference. Use this proactively when the user shares preferences, important dates, or personal details.",
    input_schema: {
      type: "object",
      properties: {
        key: {
          type: "string",
          description:
            "A short identifier for this memory (e.g., 'user_name', 'preferred_coffee', 'birthday')",
        },
        value: {
          type: "string",
          description: "The information to remember",
        },
      },
      required: ["key", "value"],
    },
  },
  {
    name: "memory_retrieve",
    description:
      "Retrieves stored information about the user. Use when you need to recall something previously told to you.",
    input_schema: {
      type: "object",
      properties: {
        key: {
          type: "string",
          description: "The key of the memory to retrieve. Pass '*' to list all memories.",
        },
      },
      required: ["key"],
    },
  },
];

export async function executeMemoryTool(
  name: "memory_store" | "memory_retrieve",
  input: Record<string, unknown>,
  userId: string
): Promise<unknown> {
  if (name === "memory_store") {
    const { key, value } = input as { key: string; value: string };

    await supabase.from("agent_memory").upsert(
      { user_id: userId, key, value, updated_at: new Date().toISOString() },
      { onConflict: "user_id,key" }
    );

    return { stored: true, key };
  }

  if (name === "memory_retrieve") {
    const { key } = input as { key: string };

    if (key === "*") {
      const { data } = await supabase
        .from("agent_memory")
        .select("key, value")
        .eq("user_id", userId);
      return { memories: data ?? [] };
    }

    const { data } = await supabase
      .from("agent_memory")
      .select("value")
      .eq("user_id", userId)
      .eq("key", key)
      .single();

    return { key, value: data?.value ?? null };
  }

  throw new Error(`Unknown memory tool: ${name}`);
}
