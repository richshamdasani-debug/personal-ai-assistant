import Anthropic from "@anthropic-ai/sdk";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ── Hyperliquid types ────────────────────────────────────────────────────────

interface Candle {
  t: number;
  T: number;
  s: string;
  i: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  n: number;
}

interface Position {
  coin: string;
  szi: string;
  entryPx: string;
  positionValue: string;
  unrealizedPnl: string;
  returnOnEquity: string;
  liquidationPx: string | null;
}

interface AccountState {
  marginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalRawUsd: string;
  };
  assetPositions: Array<{ position: Position; type: string }>;
}

// ── Technical analysis types ─────────────────────────────────────────────────

interface TACandle {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  t: number;
}

interface TimeframeAnalysis {
  zscore: number;
  slope: number;
  chop: number;
  sma20: number;
  priceVsSMAPct: number;
  trend: "up" | "down" | "neutral";
  momentum: "strong" | "moderate" | "weak";
  currentPrice: number;
  priceChange1h: number;
}

// ── Trading decision types ────────────────────────────────────────────────────

interface TradingDecision {
  decision: "buy" | "sell" | "hold";
  crvScore: number;
  reasoning: string;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  promptTokens?: number;
}

// ── Bot database row type ─────────────────────────────────────────────────────

interface BotRow {
  id: string;
  user_id: string;
  handle: string;
  name: string;
  model: string;
  symbol: string;
  timeframes: string[];
  system_prompt: string | null;
  risk_mode: "conservative" | "moderate" | "aggressive";
  max_position_usd: number;
  mode: string;
  status: string;
  hl_wallet_address: string | null;
  equity_usd: number | null;
  initial_equity_usd: number | null;
  total_trades: number;
  total_prompts: number;
}

// ── Hyperliquid helper ────────────────────────────────────────────────────────

const HL_BASE = "https://api.hyperliquid.xyz";

const INTERVAL_MS: Record<string, number> = {
  "1m": 60_000,
  "3m": 180_000,
  "5m": 300_000,
  "15m": 900_000,
  "30m": 1_800_000,
  "1h": 3_600_000,
  "2h": 7_200_000,
  "4h": 14_400_000,
  "8h": 28_800_000,
  "12h": 43_200_000,
  "1d": 86_400_000,
  "3d": 259_200_000,
  "1w": 604_800_000,
};

async function hlPost<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${HL_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Hyperliquid ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

async function fetchCandles(
  coin: string,
  interval: string,
  lookback: number
): Promise<Candle[]> {
  const intervalMs = INTERVAL_MS[interval] ?? 1_800_000;
  const endTime = Date.now();
  const startTime = endTime - intervalMs * lookback;

  const raw = await hlPost<
    Array<[number, number, string, string, string, string, string, string, string]>
  >("/info", {
    type: "candleSnapshot",
    req: { coin, interval, startTime, endTime },
  });

  return raw.map((c) => ({
    t: c[0],
    T: c[1],
    s: coin,
    i: interval,
    o: parseFloat(c[2]),
    h: parseFloat(c[3]),
    l: parseFloat(c[4]),
    c: parseFloat(c[5]),
    v: parseFloat(c[6]),
    n: parseInt(c[7], 10),
  }));
}

async function fetchAccountState(walletAddress: string): Promise<AccountState> {
  return hlPost<AccountState>("/info", {
    type: "clearinghouseState",
    user: walletAddress,
  });
}

// ── Technical analysis ────────────────────────────────────────────────────────

function sma(values: number[], period: number): number {
  if (values.length < period) return values[values.length - 1] ?? 0;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function zScore(closes: number[], period: number): number {
  if (closes.length < period) return 0;
  const slice = closes.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
  const std = Math.sqrt(variance);
  if (std === 0) return 0;
  return (closes[closes.length - 1] - mean) / std;
}

function linearRegressionSlope(closes: number[], period: number): number {
  if (closes.length < period) return 0;
  const slice = closes.slice(-period);
  const n = slice.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += slice[i];
    sumXY += i * slice[i];
    sumX2 += i * i;
  }
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return 0;
  const rawSlope = (n * sumXY - sumX * sumY) / denom;
  const mean = sumY / n;
  if (mean === 0) return 0;
  return (rawSlope / mean) * 100;
}

function choppinessIndex(candles: TACandle[], period: number): number {
  if (candles.length < period) return 50;
  const slice = candles.slice(-period);
  const sumAtr = slice.reduce((acc, c) => acc + Math.abs(c.h - c.l), 0);
  const highestHigh = Math.max(...slice.map((c) => c.h));
  const lowestLow = Math.min(...slice.map((c) => c.l));
  const range = highestHigh - lowestLow;
  if (range === 0) return 100;
  return (100 * Math.log10(sumAtr / range)) / Math.log10(period);
}

function analyzeTimeframe(candles: TACandle[], period = 20): TimeframeAnalysis {
  const closes = candles.map((c) => c.c);
  const currentPrice = closes[closes.length - 1];

  const zscore = zScore(closes, period);
  const slope = linearRegressionSlope(closes, period);
  const chop = choppinessIndex(candles, Math.min(period, candles.length));
  const sma20 = sma(closes, period);
  const priceVsSMAPct = sma20 !== 0 ? ((currentPrice - sma20) / sma20) * 100 : 0;

  const lookback1h = Math.min(2, candles.length - 1);
  const priceChange1h =
    candles.length > lookback1h
      ? ((currentPrice - candles[candles.length - 1 - lookback1h].c) /
          candles[candles.length - 1 - lookback1h].c) *
        100
      : 0;

  let trend: "up" | "down" | "neutral";
  if (slope > 0.1 && priceVsSMAPct > 0) {
    trend = "up";
  } else if (slope < -0.1 && priceVsSMAPct < 0) {
    trend = "down";
  } else {
    trend = "neutral";
  }

  const absZ = Math.abs(zscore);
  const momentum: "strong" | "moderate" | "weak" =
    absZ > 2 ? "strong" : absZ > 1 ? "moderate" : "weak";

  return {
    zscore,
    slope,
    chop,
    sma20,
    priceVsSMAPct,
    trend,
    momentum,
    currentPrice,
    priceChange1h,
  };
}

// ── LLM decision engine ───────────────────────────────────────────────────────

const DEFAULT_SYSTEM_PROMPT = `You are an algorithmic trader on Hyperliquid perpetuals. Your job is to analyze multi-timeframe technical data and make high-conviction trading decisions.

Rules:
- Only enter trades when CRV score is 1-2 (high conviction). A score of 3-5 means hold.
- CRV score: 1 = very high conviction trade, 2 = high conviction, 3 = moderate (lean hold), 4 = low conviction (hold), 5 = no trade.

Risk mode guidelines:
- Conservative: only trade with Z-score > 2 AND clear momentum AND choppiness < 40. Prefer to hold.
- Moderate: trade with Z-score > 1.5 AND supporting slope direction. Some discretion allowed.
- Aggressive: trade with Z-score > 1 when multiple timeframes align.

Additional rules:
- Avoid entering trades during high choppiness (CHOP > 61.8) across timeframes.
- Check if there are consecutive losses before entering — be more conservative.
- Never hold a position and open another in the same direction.
- If already in a profitable position, lean toward hold unless reversal signals are strong.
- Always provide clear, concise reasoning for your CRV score decision.
- Respond ONLY with valid JSON matching the schema requested.`;

function buildUserMessage(
  bot: BotRow,
  timeframeData: Record<string, TimeframeAnalysis>,
  currentPosition: { side: "long" | "short"; size: number; entryPrice: number; pnl: number } | null,
  recentTrades: Array<{ side: string; pnl: number; opened_at: string }>
): string {
  const currentPrice = Object.values(timeframeData)[0]?.currentPrice ?? 0;

  const tfLines = Object.entries(timeframeData)
    .map(
      ([tf, data]) =>
        `### ${tf} Timeframe\nZ-Score: ${data.zscore.toFixed(3)} | Slope: ${data.slope.toFixed(3)}% | CHOP: ${data.chop.toFixed(1)} | Trend: ${data.trend} | Momentum: ${data.momentum}\nPrice vs 20SMA: ${data.priceVsSMAPct.toFixed(2)}% | 1h Change: ${data.priceChange1h.toFixed(2)}%`
    )
    .join("\n\n");

  const positionSection = currentPosition
    ? `Side: ${currentPosition.side.toUpperCase()} | Size: $${currentPosition.size.toFixed(2)} | Entry: $${currentPosition.entryPrice.toFixed(2)} | Unrealized PnL: $${currentPosition.pnl.toFixed(2)}`
    : "No open position";

  let tradesSection = "No recent trades";
  if (recentTrades.length > 0) {
    const consecutiveLosses = recentTrades.slice(0, 5).filter((t) => t.pnl < 0).length;
    tradesSection =
      recentTrades
        .slice(0, 5)
        .map((t) => `${t.side.toUpperCase()} | PnL: $${t.pnl.toFixed(2)} | ${t.opened_at}`)
        .join("\n") + `\n\nConsecutive losses in last 5: ${consecutiveLosses}`;
  }

  return `## Market Analysis: ${bot.symbol}
Current Price: $${currentPrice.toFixed(2)}
Risk Mode: ${bot.risk_mode.toUpperCase()} | Max Position: $${bot.max_position_usd}

${tfLines}

## Current Position
${positionSection}

## Recent Trades (last 5)
${tradesSection}

Make your trading decision as JSON:
{
  "decision": "buy|sell|hold",
  "crv_score": 1-5,
  "reasoning": "...",
  "entry_price": null or number,
  "stop_loss": null or number,
  "take_profit": null or number
}`;
}

function parseDecisionJson(text: string): Record<string, unknown> {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) return JSON.parse(codeBlockMatch[1].trim());

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);

  throw new Error("No JSON found in LLM response");
}

async function makeTradingDecision(
  bot: BotRow,
  timeframeData: Record<string, TimeframeAnalysis>,
  currentPosition: { side: "long" | "short"; size: number; entryPrice: number; pnl: number } | null,
  recentTrades: Array<{ side: string; pnl: number; opened_at: string }>
): Promise<TradingDecision> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const systemPrompt = bot.system_prompt?.trim() || DEFAULT_SYSTEM_PROMPT;
  const userMessage = buildUserMessage(bot, timeframeData, currentPosition, recentTrades);

  const response = await client.messages.create({
    model: bot.model,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content in LLM response");
  }

  const parsed = parseDecisionJson(textBlock.text);
  const decision = parsed.decision as string;
  if (!["buy", "sell", "hold"].includes(decision)) {
    throw new Error(`Invalid decision: ${decision}`);
  }

  const crvScore = Number(parsed.crv_score);
  if (isNaN(crvScore) || crvScore < 1 || crvScore > 5) {
    throw new Error(`Invalid CRV score: ${parsed.crv_score}`);
  }

  return {
    decision: decision as "buy" | "sell" | "hold",
    crvScore: Math.round(crvScore),
    reasoning: String(parsed.reasoning ?? ""),
    entryPrice: parsed.entry_price != null ? Number(parsed.entry_price) : undefined,
    stopLoss: parsed.stop_loss != null ? Number(parsed.stop_loss) : undefined,
    takeProfit: parsed.take_profit != null ? Number(parsed.take_profit) : undefined,
    promptTokens: response.usage.input_tokens,
  };
}

// ── TradingBot class ──────────────────────────────────────────────────────────

export class TradingBot {
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private supabase: SupabaseClient;
  private tickIntervalMs: number;

  constructor(
    private botId: string,
    tickIntervalMs = 900_000
  ) {
    if (!process.env.SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY");

    this.tickIntervalMs = tickIntervalMs;
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );
  }

  run(): void {
    if (this.running) return;
    this.running = true;
    console.log(`[TradingBot:${this.botId}] Starting with interval ${this.tickIntervalMs}ms`);

    this.tick().catch((err) =>
      console.error(`[TradingBot:${this.botId}] Initial tick error:`, err)
    );

    this.intervalHandle = setInterval(() => {
      this.tick().catch((err) =>
        console.error(`[TradingBot:${this.botId}] Tick error:`, err)
      );
    }, this.tickIntervalMs);
  }

  stop(): void {
    if (this.intervalHandle !== null) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    this.running = false;
    console.log(`[TradingBot:${this.botId}] Stopped`);
  }

  async tick(): Promise<void> {
    const { data: bot, error: botError } = await this.supabase
      .from("trading_bots")
      .select("*")
      .eq("id", this.botId)
      .single();

    if (botError || !bot) {
      console.error(`[TradingBot:${this.botId}] Bot not found, stopping`);
      this.stop();
      return;
    }

    const botRow = bot as BotRow;

    if (botRow.status !== "running") {
      console.log(`[TradingBot:${this.botId}] Status is ${botRow.status}, skipping tick`);
      return;
    }

    try {
      const timeframeData: Record<string, TimeframeAnalysis> = {};

      for (const tf of botRow.timeframes) {
        const candles = await fetchCandles(botRow.symbol, tf, 50);
        if (candles.length > 0) {
          const taCandles: TACandle[] = candles.map((c) => ({
            o: c.o,
            h: c.h,
            l: c.l,
            c: c.c,
            v: c.v,
            t: c.t,
          }));
          timeframeData[tf] = analyzeTimeframe(taCandles);
        }
      }

      if (Object.keys(timeframeData).length === 0) {
        throw new Error("No timeframe data available");
      }

      const currentPrice = Object.values(timeframeData)[0].currentPrice;

      let currentPosition: {
        side: "long" | "short";
        size: number;
        entryPrice: number;
        pnl: number;
      } | null = null;

      if (botRow.hl_wallet_address) {
        try {
          const accountState = await fetchAccountState(botRow.hl_wallet_address);
          const equity = parseFloat(accountState.marginSummary.accountValue);

          const pos = accountState.assetPositions.find(
            (ap) => ap.position.coin === botRow.symbol
          );

          if (pos) {
            const szi = parseFloat(pos.position.szi);
            if (szi !== 0) {
              currentPosition = {
                side: szi > 0 ? "long" : "short",
                size: Math.abs(szi) * parseFloat(pos.position.entryPx),
                entryPrice: parseFloat(pos.position.entryPx),
                pnl: parseFloat(pos.position.unrealizedPnl),
              };
            }
          }

          await this.supabase
            .from("trading_bots")
            .update({
              equity_usd: equity,
              initial_equity_usd: botRow.initial_equity_usd ?? equity,
            })
            .eq("id", this.botId);
        } catch (err) {
          console.warn(`[TradingBot:${this.botId}] Could not fetch account state:`, err);
        }
      }

      const { data: tradeRows } = await this.supabase
        .from("bot_trades")
        .select("side, pnl_usd, opened_at")
        .eq("bot_id", this.botId)
        .order("opened_at", { ascending: false })
        .limit(5);

      const recentTrades = (tradeRows ?? []).map((t) => ({
        side: t.side as string,
        pnl: (t.pnl_usd as number) ?? 0,
        opened_at: t.opened_at as string,
      }));

      const decision = await makeTradingDecision(
        botRow,
        timeframeData,
        currentPosition,
        recentTrades
      );

      const { data: decisionRow } = await this.supabase
        .from("bot_decisions")
        .insert({
          bot_id: this.botId,
          symbol: botRow.symbol,
          decision: decision.decision,
          crv_score: decision.crvScore,
          reasoning: decision.reasoning,
          prompt_tokens: decision.promptTokens ?? null,
          model: botRow.model,
          timeframe_data: timeframeData,
          price_at_decision: currentPrice,
        })
        .select()
        .single();

      await this.supabase
        .from("trading_bots")
        .update({ total_prompts: (botRow.total_prompts ?? 0) + 1 })
        .eq("id", this.botId);

      console.log(
        `[TradingBot:${this.botId}] Decision: ${decision.decision} (CRV: ${decision.crvScore}) @ $${currentPrice.toFixed(2)}`
      );

      if (
        (decision.decision === "buy" || decision.decision === "sell") &&
        decision.crvScore <= 2
      ) {
        const positionSize = Math.min(botRow.max_position_usd, botRow.max_position_usd);

        await this.supabase.from("bot_trades").insert({
          bot_id: this.botId,
          symbol: botRow.symbol,
          side: decision.decision,
          size_usd: positionSize,
          entry_price: decision.entryPrice ?? currentPrice,
          status: "open",
          decision_id: decisionRow?.id ?? null,
        });

        await this.supabase
          .from("trading_bots")
          .update({ total_trades: (botRow.total_trades ?? 0) + 1 })
          .eq("id", this.botId);

        console.log(
          `[TradingBot:${this.botId}] Paper trade opened: ${decision.decision} $${positionSize} of ${botRow.symbol}`
        );
      }
    } catch (err) {
      console.error(`[TradingBot:${this.botId}] Tick failed:`, err);

      await this.supabase
        .from("trading_bots")
        .update({ status: "error" })
        .eq("id", this.botId);

      this.stop();
    }
  }
}
