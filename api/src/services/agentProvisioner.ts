/**
 * Agent Provisioner
 *
 * Manages the lifecycle of per-user agent containers.
 * provisionAgent  — creates DB record, spawns container, registers Telegram webhook
 * deprovisionAgent — stops/removes container and DB record (by agentId)
 * getAgentStatus  — returns current status (by agentId)
 * suspendAgent    — pauses container without removing it (subscription paused)
 */

import { exec } from "child_process";
import { promisify } from "util";
import { supabase } from "./supabase.js";

const execAsync = promisify(exec);

const AGENT_IMAGE =
  process.env.AGENT_CONTAINER_IMAGE ?? "pai/agent:latest";

export interface AgentInfo {
  agentId: string;
  containerId: string;
  status: "running" | "stopped" | "provisioning" | "error" | "deprovisioned";
}

// ── Telegram webhook registration ──────────────────────────────────────────

async function registerTelegramWebhook(): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;

  if (!token || !webhookUrl) {
    console.warn("[Provisioner] TELEGRAM_BOT_TOKEN or TELEGRAM_WEBHOOK_URL not set — skipping webhook registration");
    return;
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl }),
      }
    );
    const json = await res.json() as { ok: boolean; description?: string };
    if (!json.ok) {
      console.error("[Provisioner] Telegram webhook registration failed:", json.description);
    } else {
      console.log("[Provisioner] Telegram webhook registered:", webhookUrl);
    }
  } catch (err) {
    console.error("[Provisioner] Failed to register Telegram webhook:", err);
  }
}

// ── Provision ──────────────────────────────────────────────────────────────

/**
 * Creates an agent record in the DB, spawns its Docker container,
 * and registers the Telegram bot webhook.
 */
export async function provisionAgent(
  userId: string,
  tier: string
): Promise<AgentInfo> {
  const containerName = `pai-agent-${userId}`;

  // If a running agent already exists, return it
  const { data: existing } = await supabase
    .from("agents")
    .select("id, container_id, status")
    .eq("user_id", userId)
    .single();

  if (existing?.status === "running") {
    return {
      agentId: existing.id,
      containerId: existing.container_id ?? "",
      status: "running",
    };
  }

  // Upsert agent row to "provisioning" before touching Docker
  const { data: agent, error: upsertError } = await supabase
    .from("agents")
    .upsert(
      {
        user_id: userId,
        name: "My Assistant",
        type: "personal",
        status: "provisioning",
        config: { tier },
        container_name: containerName,
        provisioned_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("id")
    .single();

  if (upsertError || !agent) {
    console.error("[Provisioner] Failed to upsert agent record:", upsertError);
    return { agentId: "", containerId: "", status: "error" };
  }

  const agentId = agent.id as string;

  try {
    const { stdout } = await execAsync(
      [
        "docker run -d",
        `--name ${containerName}`,
        "--restart unless-stopped",
        "--memory 512m --cpus 0.5",
        `-e USER_ID=${userId}`,
        `-e AGENT_ID=${agentId}`,
        `-e TIER=${tier}`,
        `-e ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY}`,
        `-e REDIS_URL=${process.env.REDIS_URL}`,
        `-e SUPABASE_URL=${process.env.SUPABASE_URL}`,
        `-e SUPABASE_SERVICE_ROLE_KEY=${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "--network pai-network",
        AGENT_IMAGE,
      ].join(" ")
    );

    const containerId = stdout.trim().slice(0, 12);

    await supabase
      .from("agents")
      .update({ container_id: containerId, status: "running" })
      .eq("id", agentId);

    // Register the Telegram bot webhook (idempotent — safe to call on every provision)
    await registerTelegramWebhook();

    return { agentId, containerId, status: "running" };
  } catch (err) {
    console.error(`[Provisioner] Failed to start agent for user ${userId}:`, err);

    await supabase
      .from("agents")
      .update({ status: "error" })
      .eq("id", agentId);

    return { agentId, containerId: "", status: "error" };
  }
}

// ── Deprovision ────────────────────────────────────────────────────────────

/**
 * Stops and removes the agent container, then deletes the DB record.
 * Takes the agent's UUID (agents.id).
 */
export async function deprovisionAgent(agentId: string): Promise<void> {
  const { data: agent } = await supabase
    .from("agents")
    .select("container_name, user_id")
    .eq("id", agentId)
    .single();

  if (!agent) {
    console.warn(`[Provisioner] deprovisionAgent: no agent found for id ${agentId}`);
    return;
  }

  try {
    await execAsync(`docker rm -f ${agent.container_name}`);
  } catch (err) {
    // Container may already be gone — log and continue
    console.warn(`[Provisioner] docker rm failed for ${agent.container_name}:`, err);
  }

  await supabase.from("agents").delete().eq("id", agentId);
}

// ── Get status ────────────────────────────────────────────────────────────

/**
 * Returns the current status of an agent by its UUID.
 */
export async function getAgentStatus(agentId: string): Promise<AgentInfo | null> {
  const { data } = await supabase
    .from("agents")
    .select("id, container_id, status")
    .eq("id", agentId)
    .single();

  if (!data) return null;

  return {
    agentId: data.id,
    containerId: data.container_id ?? "",
    status: data.status as AgentInfo["status"],
  };
}

// ── Get status by userId (convenience for routes) ─────────────────────────

export async function getAgentStatusByUserId(userId: string): Promise<AgentInfo | null> {
  const { data } = await supabase
    .from("agents")
    .select("id, container_id, status")
    .eq("user_id", userId)
    .single();

  if (!data) return null;

  return {
    agentId: data.id,
    containerId: data.container_id ?? "",
    status: data.status as AgentInfo["status"],
  };
}

// ── Suspend ───────────────────────────────────────────────────────────────

/**
 * Gracefully stops (but does not remove) an agent container.
 * Used when a subscription is paused.
 */
export async function suspendAgent(userId: string): Promise<void> {
  const { data: agent } = await supabase
    .from("agents")
    .select("id, container_name")
    .eq("user_id", userId)
    .single();

  if (!agent) return;

  try {
    await execAsync(`docker stop ${agent.container_name}`);
    await supabase.from("agents").update({ status: "stopped" }).eq("id", agent.id);
  } catch (err) {
    console.error(`[Provisioner] Failed to suspend agent for user ${userId}:`, err);
  }
}

// ── Legacy alias (kept for backward compat with billing.ts) ───────────────
export async function teardownAgent(userId: string): Promise<void> {
  const { data: agent } = await supabase
    .from("agents")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (agent) await deprovisionAgent(agent.id);
}
