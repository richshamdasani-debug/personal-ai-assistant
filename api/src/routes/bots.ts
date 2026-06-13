import { Router, type Request } from "express";
import { z } from "zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { supabase } from "../services/supabase.js";

export const botsRouter = Router();

botsRouter.use(requireAuth);

function auth(req: Request): AuthenticatedRequest {
  return req as unknown as AuthenticatedRequest;
}

const CreateBotSchema = z.object({
  handle: z
    .string()
    .min(2)
    .max(32)
    .regex(/^[a-zA-Z0-9_-]+$/, "Handle must be alphanumeric with _ or -"),
  name: z.string().min(1).max(64),
  model: z.string().min(1).default("claude-haiku-4-5-20251001"),
  symbol: z.string().min(1).max(20).default("BTC"),
  timeframes: z.array(z.string()).min(1).default(["30m", "4h", "1d"]),
  riskMode: z.enum(["conservative", "moderate", "aggressive"]).default("moderate"),
  maxPositionUsd: z.number().positive().max(1_000_000).default(100),
  systemPrompt: z.string().max(4000).optional(),
  hlWalletAddress: z.string().optional(),
  mode: z.enum(["server", "client"]).default("server"),
});

const UpdateBotSchema = CreateBotSchema.partial().omit({ handle: true });

// GET /api/bots
botsRouter.get("/", async (req, res) => {
  const { userId } = auth(req);

  const { data, error } = await supabase
    .from("trading_bots")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(data);
});

// POST /api/bots
botsRouter.post("/", async (req, res) => {
  const { userId } = auth(req);

  const parsed = CreateBotSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const {
    handle,
    name,
    model,
    symbol,
    timeframes,
    riskMode,
    maxPositionUsd,
    systemPrompt,
    hlWalletAddress,
    mode,
  } = parsed.data;

  const { data, error } = await supabase
    .from("trading_bots")
    .insert({
      user_id: userId,
      handle,
      name,
      model,
      symbol,
      timeframes,
      risk_mode: riskMode,
      max_position_usd: maxPositionUsd,
      system_prompt: systemPrompt ?? null,
      hl_wallet_address: hlWalletAddress ?? null,
      mode,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      res.status(409).json({ error: "Handle already taken" });
      return;
    }
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json(data);
});

// GET /api/bots/:id
botsRouter.get("/:id", async (req, res) => {
  const { userId } = auth(req);
  const { id } = req.params;

  const { data: bot, error: botError } = await supabase
    .from("trading_bots")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (botError || !bot) {
    res.status(404).json({ error: "Bot not found" });
    return;
  }

  const { data: decisions } = await supabase
    .from("bot_decisions")
    .select("*")
    .eq("bot_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  res.json({ ...bot, recentDecisions: decisions ?? [] });
});

// PUT /api/bots/:id
botsRouter.put("/:id", async (req, res) => {
  const { userId } = auth(req);
  const { id } = req.params;

  const parsed = UpdateBotSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const updates: Record<string, unknown> = {};
  const d = parsed.data;

  if (d.name !== undefined) updates.name = d.name;
  if (d.model !== undefined) updates.model = d.model;
  if (d.symbol !== undefined) updates.symbol = d.symbol;
  if (d.timeframes !== undefined) updates.timeframes = d.timeframes;
  if (d.riskMode !== undefined) updates.risk_mode = d.riskMode;
  if (d.maxPositionUsd !== undefined) updates.max_position_usd = d.maxPositionUsd;
  if (d.systemPrompt !== undefined) updates.system_prompt = d.systemPrompt;
  if (d.hlWalletAddress !== undefined) updates.hl_wallet_address = d.hlWalletAddress;
  if (d.mode !== undefined) updates.mode = d.mode;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  const { data, error } = await supabase
    .from("trading_bots")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    res.status(404).json({ error: "Bot not found or update failed" });
    return;
  }

  res.json(data);
});

// DELETE /api/bots/:id
botsRouter.delete("/:id", async (req, res) => {
  const { userId } = auth(req);
  const { id } = req.params;

  const { error } = await supabase
    .from("trading_bots")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ ok: true });
});

// POST /api/bots/:id/start
botsRouter.post("/:id/start", async (req, res) => {
  const { userId } = auth(req);
  const { id } = req.params;

  const { data, error } = await supabase
    .from("trading_bots")
    .update({ status: "running" })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    res.status(404).json({ error: "Bot not found" });
    return;
  }

  res.json({ ok: true, status: (data as { status: string }).status });
});

// POST /api/bots/:id/stop
botsRouter.post("/:id/stop", async (req, res) => {
  const { userId } = auth(req);
  const { id } = req.params;

  const { data, error } = await supabase
    .from("trading_bots")
    .update({ status: "stopped" })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    res.status(404).json({ error: "Bot not found" });
    return;
  }

  res.json({ ok: true, status: (data as { status: string }).status });
});

// GET /api/bots/:id/decisions
botsRouter.get("/:id/decisions", async (req, res) => {
  const { userId } = auth(req);
  const { id } = req.params;

  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)));
  const offset = (page - 1) * limit;

  const { data: bot } = await supabase
    .from("trading_bots")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!bot) {
    res.status(404).json({ error: "Bot not found" });
    return;
  }

  const { data, error, count } = await supabase
    .from("bot_decisions")
    .select("*", { count: "exact" })
    .eq("bot_id", id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ data: data ?? [], total: count ?? 0, page, limit });
});

// GET /api/bots/:id/trades
botsRouter.get("/:id/trades", async (req, res) => {
  const { userId } = auth(req);
  const { id } = req.params;

  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)));
  const offset = (page - 1) * limit;

  const { data: bot } = await supabase
    .from("trading_bots")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!bot) {
    res.status(404).json({ error: "Bot not found" });
    return;
  }

  const { data, error, count } = await supabase
    .from("bot_trades")
    .select("*", { count: "exact" })
    .eq("bot_id", id)
    .order("opened_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ data: data ?? [], total: count ?? 0, page, limit });
});
