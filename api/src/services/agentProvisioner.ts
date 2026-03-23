/**
 * Agent Provisioner
 *
 * Spawns and manages per-user agent Docker containers.
 * In production this would integrate with Kubernetes/ECS;
 * for MVP we use the Docker Engine API via the docker CLI.
 */

import { exec } from "child_process";
import { promisify } from "util";
import { supabase } from "./supabase.js";

const execAsync = promisify(exec);

const AGENT_IMAGE =
  process.env.AGENT_CONTAINER_IMAGE ?? "pai/agent:latest";

export interface AgentInfo {
  containerId: string;
  status: "running" | "stopped" | "error";
}

/**
 * Provisions a new agent container for a user.
 * Records the container ID in Supabase for tracking.
 */
export async function provisionAgent(userId: string): Promise<AgentInfo> {
  const containerName = `pai-agent-${userId}`;

  // Check if one already exists
  const existing = await getAgentStatus(userId);
  if (existing?.status === "running") return existing;

  try {
    const { stdout } = await execAsync(
      [
        "docker run -d",
        `--name ${containerName}`,
        "--restart unless-stopped",
        `--memory 512m --cpus 0.5`,
        `-e USER_ID=${userId}`,
        `-e ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY}`,
        `-e REDIS_URL=${process.env.REDIS_URL}`,
        `-e SUPABASE_URL=${process.env.SUPABASE_URL}`,
        `-e SUPABASE_SERVICE_ROLE_KEY=${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        `--network pai-network`,
        AGENT_IMAGE,
      ].join(" ")
    );

    const containerId = stdout.trim().slice(0, 12);

    // Persist to DB
    await supabase.from("agents").upsert({
      user_id: userId,
      container_id: containerId,
      container_name: containerName,
      status: "running",
      provisioned_at: new Date().toISOString(),
    });

    return { containerId, status: "running" };
  } catch (err) {
    console.error(`[Provisioner] Failed to start agent for ${userId}:`, err);

    await supabase
      .from("agents")
      .update({ status: "error" })
      .eq("user_id", userId);

    return { containerId: "", status: "error" };
  }
}

/**
 * Gracefully stops (but does not remove) an agent container.
 * Used when a subscription is paused.
 */
export async function suspendAgent(userId: string): Promise<void> {
  const containerName = `pai-agent-${userId}`;
  try {
    await execAsync(`docker stop ${containerName}`);
    await supabase
      .from("agents")
      .update({ status: "stopped" })
      .eq("user_id", userId);
  } catch (err) {
    console.error(`[Provisioner] Failed to suspend agent for ${userId}:`, err);
  }
}

/**
 * Stops and removes an agent container + all its data.
 * Used when a subscription is cancelled.
 */
export async function teardownAgent(userId: string): Promise<void> {
  const containerName = `pai-agent-${userId}`;
  try {
    await execAsync(`docker rm -f ${containerName}`);
    await supabase.from("agents").delete().eq("user_id", userId);
  } catch (err) {
    console.error(`[Provisioner] Failed to teardown agent for ${userId}:`, err);
  }
}

/**
 * Returns the current status of a user's agent container.
 */
export async function getAgentStatus(
  userId: string
): Promise<AgentInfo | null> {
  const { data } = await supabase
    .from("agents")
    .select("container_id, status")
    .eq("user_id", userId)
    .single();

  if (!data) return null;
  return { containerId: data.container_id, status: data.status };
}
