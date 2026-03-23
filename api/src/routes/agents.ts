import { Router } from "express";
import {
  getAgentStatus,
  provisionAgent,
  suspendAgent,
} from "../services/agentProvisioner.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

export const agentRouter = Router();

// All agent routes require auth
agentRouter.use(requireAuth);

// GET /api/agents/status
agentRouter.get("/status", async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const status = await getAgentStatus(userId);
  res.json(status ?? { status: "not_provisioned" });
});

// POST /api/agents/provision
agentRouter.post("/provision", async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const result = await provisionAgent(userId);
  res.json(result);
});

// POST /api/agents/suspend
agentRouter.post("/suspend", async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  await suspendAgent(userId);
  res.json({ ok: true });
});
