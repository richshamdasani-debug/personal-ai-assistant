/**
 * Webhook ingestion: Telegram & WhatsApp → user's agent queue
 *
 * Each message is looked up by the user's bot/phone mapping,
 * then published to Redis so the agent container picks it up.
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

// POST /api/webhooks/telegram
webhooksRouter.post("/telegram", async (req: Request, res: Response) => {
  const update = req.body;

  // Extract the chat ID and text from the Telegram update
  const chatId =
    update?.message?.chat?.id ?? update?.callback_query?.message?.chat?.id;
  const text =
    update?.message?.text ?? update?.callback_query?.data ?? "";

  if (!chatId) {
    res.sendStatus(200); // Always 200 to Telegram to prevent retries
    return;
  }

  // Look up which user owns this Telegram chat
  const { data: mapping } = await supabase
    .from("telegram_mappings")
    .select("user_id")
    .eq("chat_id", String(chatId))
    .single();

  if (!mapping) {
    console.warn(`[Telegram] No user mapped to chat ${chatId}`);
    res.sendStatus(200);
    return;
  }

  // Publish to the user's agent queue
  const redis = await getRedis();
  await redis.publish(
    `agent:${mapping.user_id}:inbox`,
    JSON.stringify({ channel: "telegram", chatId, text, update })
  );

  res.sendStatus(200);
});

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
