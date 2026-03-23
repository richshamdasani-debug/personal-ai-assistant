/**
 * Agent Container Entrypoint
 *
 * Each running container is tied to one user (USER_ID env var).
 * It subscribes to the user's Redis inbox channel and processes
 * incoming messages using PersonalAgent.
 */

import { createClient } from "redis";
import { PersonalAgent } from "./PersonalAgent.js";
import { TelegramChannel } from "./channels/telegram.js";
import { WhatsAppChannel } from "./channels/whatsapp.js";

const USER_ID = process.env.USER_ID;
if (!USER_ID) throw new Error("USER_ID env var is required");

interface IncomingMessage {
  channel: "telegram" | "whatsapp" | "web";
  text: string;
  chatId?: string | number;
  phone?: string;
  sessionId?: string;
}

async function main() {
  console.log(`[Agent] Starting for user ${USER_ID}`);

  // Instantiate the AI agent for this user
  const agent = new PersonalAgent({ userId: USER_ID });
  await agent.init();

  // Channel senders for replies
  const telegram = new TelegramChannel();
  const whatsapp = new WhatsAppChannel();

  // Subscribe to this user's Redis inbox
  const subscriber = createClient({ url: process.env.REDIS_URL });
  subscriber.on("error", (err) => console.error("[Redis subscriber]", err));
  await subscriber.connect();

  const channel = `agent:${USER_ID}:inbox`;
  console.log(`[Agent] Subscribed to ${channel}`);

  await subscriber.subscribe(channel, async (raw: string) => {
    let msg: IncomingMessage;
    try {
      msg = JSON.parse(raw) as IncomingMessage;
    } catch {
      console.error("[Agent] Invalid message JSON:", raw);
      return;
    }

    console.log(`[Agent] Received on ${msg.channel}: "${msg.text.slice(0, 60)}"`);

    try {
      // Run the agentic loop and stream back the reply
      const reply = await agent.respond({
        userMessage: msg.text,
        sessionId: msg.sessionId ?? msg.chatId?.toString() ?? msg.phone,
      });

      // Route the reply back to the originating channel
      if (msg.channel === "telegram" && msg.chatId) {
        await telegram.send(msg.chatId, reply);
      } else if (msg.channel === "whatsapp" && msg.phone) {
        await whatsapp.send(msg.phone, reply);
      }
    } catch (err) {
      console.error("[Agent] Error processing message:", err);
    }
  });

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("[Agent] Shutting down...");
    await subscriber.unsubscribe(channel);
    await subscriber.quit();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("[Agent] Fatal error:", err);
  process.exit(1);
});
