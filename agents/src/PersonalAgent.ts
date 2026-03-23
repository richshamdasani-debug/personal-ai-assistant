/**
 * PersonalAgent — Core agentic loop
 *
 * Wraps the Anthropic API with:
 * - Persistent per-session conversation history (via Supabase)
 * - Tool use (memory, web search, calendar)
 * - Adaptive thinking on claude-opus-4-6
 * - Streaming for low-latency first-token delivery
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { ALL_TOOLS, executeTool, type ToolName } from "./tools/index.js";

const SYSTEM_PROMPT = `You are a personal AI assistant — always available, always helpful.
You have a persistent memory so you remember context across conversations.
You can search the web, manage tasks, set reminders, and help with anything the user needs.
Be concise, warm, and direct. If uncertain, ask a clarifying question.
Today's date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.`;

interface AgentOptions {
  userId: string;
}

interface RespondOptions {
  userMessage: string;
  sessionId?: string;
}

export class PersonalAgent {
  private client: Anthropic;
  private supabase: ReturnType<typeof createClient>;
  private userId: string;

  constructor({ userId }: AgentOptions) {
    if (!process.env.ANTHROPIC_API_KEY)
      throw new Error("Missing ANTHROPIC_API_KEY");

    this.userId = userId;
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
  }

  /** Load any agent-level state (user preferences, etc.) */
  async init(): Promise<void> {
    const { data } = await this.supabase
      .from("users")
      .select("name, plan")
      .eq("id", this.userId)
      .single();

    if (data) {
      console.log(`[Agent] Loaded user ${data.name} (plan: ${data.plan})`);
    }
  }

  /**
   * Core agentic loop:
   * 1. Load recent conversation history
   * 2. Call Claude with tools + adaptive thinking
   * 3. Execute any tool calls and feed results back
   * 4. Stream + collect final response
   * 5. Persist messages to Supabase
   */
  async respond({ userMessage, sessionId }: RespondOptions): Promise<string> {
    const session = sessionId ?? "default";

    // Load last N messages for context (sliding window)
    const history = await this.loadHistory(session, 20);

    const messages: Anthropic.MessageParam[] = [
      ...history,
      { role: "user", content: userMessage },
    ];

    let finalText = "";

    // Agentic loop — keep going until no more tool calls
    while (true) {
      // Use streaming + adaptive thinking for responsive feel
      const stream = this.client.messages.stream({
        model: "claude-opus-4-6",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        thinking: { type: "adaptive" },
        tools: ALL_TOOLS,
        messages,
      });

      // Stream text tokens as they arrive (useful for Web channel SSE)
      stream.on("text", (delta) => {
        process.stdout.write(delta);
      });

      const response = await stream.finalMessage();

      // Collect text output
      finalText = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");

      // If no tool calls, we're done
      if (response.stop_reason !== "tool_use") break;

      // Execute all requested tools
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );

      messages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        toolUseBlocks.map(async (tool) => {
          console.log(`[Agent] Tool: ${tool.name}`, tool.input);

          const result = await executeTool(
            tool.name as ToolName,
            tool.input as Record<string, unknown>,
            { userId: this.userId }
          );

          return {
            type: "tool_result" as const,
            tool_use_id: tool.id,
            content: JSON.stringify(result),
          };
        })
      );

      messages.push({ role: "user", content: toolResults });
    }

    // Persist the exchange
    await this.saveMessages(session, userMessage, finalText);

    return finalText;
  }

  /** Loads the N most recent message pairs for this session */
  private async loadHistory(
    sessionId: string,
    limit: number
  ): Promise<Anthropic.MessageParam[]> {
    const { data } = await this.supabase
      .from("messages")
      .select("role, content")
      .eq("user_id", this.userId)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!data) return [];

    return data
      .reverse()
      .map((row) => ({ role: row.role as "user" | "assistant", content: row.content }));
  }

  /** Persists user + assistant messages */
  private async saveMessages(
    sessionId: string,
    userMessage: string,
    assistantMessage: string
  ): Promise<void> {
    await this.supabase.from("messages").insert([
      {
        user_id: this.userId,
        session_id: sessionId,
        role: "user",
        content: userMessage,
      },
      {
        user_id: this.userId,
        session_id: sessionId,
        role: "assistant",
        content: assistantMessage,
      },
    ]);
  }
}
