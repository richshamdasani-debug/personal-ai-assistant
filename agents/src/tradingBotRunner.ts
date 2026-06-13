import { createClient } from "@supabase/supabase-js";
import { TradingBot } from "./TradingBot.js";

const POLL_INTERVAL_MS = 30_000;
const TICK_INTERVAL_MS = parseInt(process.env.BOT_TICK_INTERVAL_MS ?? "900000", 10);

if (!process.env.SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
if (!process.env.ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const activeBots = new Map<string, TradingBot>();

async function syncBots(): Promise<void> {
  const { data: runningBots, error } = await supabase
    .from("trading_bots")
    .select("id, mode")
    .eq("status", "running")
    .eq("mode", "server");

  if (error) {
    console.error("[Runner] Failed to fetch running bots:", error.message);
    return;
  }

  const runningIds = new Set((runningBots ?? []).map((b: { id: string }) => b.id));

  for (const [botId, bot] of activeBots.entries()) {
    if (!runningIds.has(botId)) {
      console.log(`[Runner] Stopping bot ${botId} (no longer running)`);
      bot.stop();
      activeBots.delete(botId);
    }
  }

  for (const id of runningIds) {
    if (!activeBots.has(id)) {
      console.log(`[Runner] Starting bot ${id}`);
      const bot = new TradingBot(id, TICK_INTERVAL_MS);
      activeBots.set(id, bot);
      bot.run();
    }
  }
}

async function main(): Promise<void> {
  console.log("[Runner] Trading bot runner started");
  console.log(`[Runner] Polling every ${POLL_INTERVAL_MS / 1000}s for running bots`);
  console.log(`[Runner] Bot tick interval: ${TICK_INTERVAL_MS / 1000}s`);

  await syncBots();

  const pollHandle = setInterval(() => {
    syncBots().catch((err) =>
      console.error("[Runner] Sync error:", err)
    );
  }, POLL_INTERVAL_MS);

  process.on("SIGTERM", () => {
    console.log("[Runner] SIGTERM received, shutting down...");
    clearInterval(pollHandle);
    for (const [botId, bot] of activeBots.entries()) {
      console.log(`[Runner] Stopping bot ${botId}`);
      bot.stop();
    }
    activeBots.clear();
    process.exit(0);
  });

  process.on("SIGINT", () => {
    console.log("[Runner] SIGINT received, shutting down...");
    clearInterval(pollHandle);
    for (const [botId, bot] of activeBots.entries()) {
      console.log(`[Runner] Stopping bot ${botId}`);
      bot.stop();
    }
    activeBots.clear();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("[Runner] Fatal error:", err);
  process.exit(1);
});
