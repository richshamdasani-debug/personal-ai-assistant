import { Router } from "express";
import {
  getAgentStatusByUserId,
  provisionAgent,
  suspendAgent,
} from "../services/agentProvisioner.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { supabase } from "../services/supabase.js";

export const agentRouter = Router();

// All agent routes require auth
agentRouter.use(requireAuth);

// GET /api/agents/status
agentRouter.get("/status", async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const status = await getAgentStatusByUserId(userId);
  res.json(status ?? { status: "not_provisioned" });
});

// POST /api/agents/provision
agentRouter.post("/provision", async (req, res) => {
  const { userId } = req as AuthenticatedRequest;

  // Look up the user's current plan to pass as tier
  const { data: user } = await supabase
    .from("users")
    .select("subscription_tier")
    .eq("id", userId)
    .single();

  const tier = user?.subscription_tier ?? "starter";
  const result = await provisionAgent(userId, tier);
  res.json(result);
});

// POST /api/agents/suspend
agentRouter.post("/suspend", async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  await suspendAgent(userId);
  res.json({ ok: true });
});
