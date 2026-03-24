/**
 * Telegram Bot Webhook Handler
 *
 * Receives updates from Telegram, routes each message to the correct
 * user's agent, and sends an immediate acknowledgement back to the user.
 *
 * Mount this at: POST /api/webhooks/telegram
 */

import { Router, type Request, type Response } from "express";
import { supabase } from "../services/supabase.js";

export const telegramRouter = Router();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// ── Telegram Bot API helper ────────────────────────────────────────────────

async function sendTelegramMessage(chatId: number | string, text: string): Promise<void> {
  if (!BOT_TOKEN) {
    console.warn("[Telegram] BOT_TOKEN not set — cannot send reply");
    return;
  }

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
  } catch (err) {
    console.error("[Telegram] sendMessage failed:", err);
  }
}

// ── Webhook endpoint ───────────────────────────────────────────────────────

telegramRouter.post("/", async (req: Request, res: Response) => {
  // Acknowledge immediately — Telegram retries if we don't respond within 60 s
  res.sendStatus(200);

  const update = req.body as TelegramUpdate;

  const message = update.message ?? update.edited_message ?? update.callback_query?.message;
  const chatId = message?.chat?.id ?? update.callback_query?.message?.chat?.id;
  const text = update.message?.text ?? update.callback_query?.data ?? "";
  const from = update.message?.from ?? update.callback_query?.from;
  const firstName = from?.first_name ?? "there";

  if (!chatId) return;

  // Handle /start — register the user's chat_id
  if (text.startsWith("/start")) {
    const payload = text.split(" ")[1]; // e.g. /start <userId>

    if (payload) {
      // Link this chat to the user account
      await supabase.from("telegram_mappings").upsert(
        { chat_id: String(chatId), user_id: payload },
        { onConflict: "chat_id" }
      );

      // Also store on the agent record for quick dashboard display
      await supabase
        .from("agents")
        .update({ telegram_chat_id: String(chatId) })
        .eq("user_id", payload);

      await sendTelegramMessage(
        chatId,
        `👋 Hi ${firstName}! Your Personal AI Assistant is connected.\n\n` +
        `Your agent is being set up — this takes about 30 seconds. ` +
        `Once ready, just send me a message and I'll get to work!`
      );
      return;
    }

    // No payload — unlinked /start
    await sendTelegramMessage(
      chatId,
      `👋 Hi ${firstName}! To connect your account, please use the link from your PAI dashboard.`
    );
    return;
  }

  // Look up which user owns this chat
  const { data: mapping } = await supabase
    .from("telegram_mappings")
    .select("user_id")
    .eq("chat_id", String(chatId))
    .single();

  if (!mapping) {
    await sendTelegramMessage(
      chatId,
      `I don't recognise this chat. Please connect your account from the PAI dashboard first.`
    );
    return;
  }

  // Check agent status
  const { data: agent } = await supabase
    .from("agents")
    .select("id, status")
    .eq("user_id", mapping.user_id)
    .single();

  if (!agent || agent.status === "provisioning") {
    await sendTelegramMessage(
      chatId,
      `⏳ Your agent is still being set up. Please try again in a moment!`
    );
    return;
  }

  if (agent.status === "stopped" || agent.status === "deprovisioned") {
    await sendTelegramMessage(
      chatId,
      `😴 Your agent is currently offline. Check your subscription in the PAI dashboard.`
    );
    return;
  }

  // Echo the message and queue it for the agent to process
  if (text) {
    await sendTelegramMessage(chatId, `📨 Got it: "${text}"\n\nYour agent is processing your request...`);
  }

  // Publish to the agent's inbox queue (picked up by the agent container)
  try {
    // Dynamically import Redis only if available — keeps the handler functional
    // even when Redis is not configured (dev mode)
    const { createClient } = await import("redis");
    const redis = createClient({ url: process.env.REDIS_URL });
    redis.on("error", (err) => console.error("[Redis]", err));
    await redis.connect();
    await redis.publish(
      `agent:${mapping.user_id}:inbox`,
      JSON.stringify({ channel: "telegram", chatId, text, agentId: agent.id, update })
    );
    await redis.quit();
  } catch (err) {
    console.error("[Telegram] Failed to publish to Redis queue:", err);
  }
});

// ── Types ──────────────────────────────────────────────────────────────────

interface TelegramUser {
  id: number;
  first_name?: string;
  username?: string;
}

interface TelegramChat {
  id: number;
  type: string;
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  text?: string;
}

interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}
