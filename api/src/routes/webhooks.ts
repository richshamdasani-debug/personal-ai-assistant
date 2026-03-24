/**
 * Webhook ingestion: WhatsApp → user's agent queue
 *
 * Telegram is now handled by api/src/routes/telegram.ts (mounted directly
 * at /api/webhooks/telegram in index.ts).
 */

import { Router, type Request, type Response } from "express";
import { createClient } from "redis";
import { supabase } from "../services/supabase.js";
import { stripeWebhookHandler } from "./billing.js";

export const webhooksRouter = Router();

// Lazy Redis client — shared across webhook calls
let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedis() {
  if (!redisClient) {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on("error", (err) =>
      console.error("[Redis] Connection error:", err)
    );
    await redisClient.connect();
  }
  return redisClient;
}

// POST /api/webhooks/whatsapp (Twilio)
webhooksRouter.post("/whatsapp", async (req: Request, res: Response) => {
  const { From, Body } = req.body as { From: string; Body: string };
  const phone = From?.replace("whatsapp:", "");

  if (!phone || !Body) {
    res.sendStatus(200);
    return;
  }

  const { data: mapping } = await supabase
    .from("whatsapp_mappings")
    .select("user_id")
    .eq("phone", phone)
    .single();

  if (!mapping) {
    console.warn(`[WhatsApp] No user mapped to phone ${phone}`);
    res.sendStatus(200);
    return;
  }

  const redis = await getRedis();
  await redis.publish(
    `agent:${mapping.user_id}:inbox`,
    JSON.stringify({ channel: "whatsapp", phone, text: Body })
  );

  // Twilio expects TwiML 200 response (empty body is fine for async flows)
  res.set("Content-Type", "text/xml").send("<Response/>");
});

// POST /api/webhooks/stripe (raw body — see index.ts)
webhooksRouter.post(
  "/stripe",
  (req, res) =>
    stripeWebhookHandler(
      req as unknown as { body: Buffer; headers: Record<string, string | string[] | undefined> },
      res as unknown as { status: (n: number) => { json: (d: unknown) => void } }
    )
);
