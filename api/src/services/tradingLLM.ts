import Anthropic from "@anthropic-ai/sdk";
import { type TimeframeAnalysis } from "./technicalAnalysis.js";

export interface TradingDecision {
  decision: "buy" | "sell" | "hold";
  crvScore: number;
  reasoning: string;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  promptTokens?: number;
}

export interface BotContext {
  symbol: string;
  currentPrice: number;
  model: string;
  systemPrompt?: string;
  riskMode: "conservative" | "moderate" | "aggressive";
  maxPositionUsd: number;
  currentPosition?: {
    side: "long" | "short";
    size: number;
    entryPrice: number;
    pnl: number;
  } | null;
  recentTrades?: Array<{ side: string; pnl: number; openedAt: string }>;
  recentDecisions?: Array<{ decision: string; crvScore: number; createdAt: string }>;
  timeframeData: Record<string, TimeframeAnalysis>;
}

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

function buildUserMessage(ctx: BotContext): string {
  const tfLines = Object.entries(ctx.timeframeData)
    .map(([tf, data]) => {
      return `### ${tf} Timeframe
Z-Score: ${data.zscore.toFixed(3)} | Slope: ${data.slope.toFixed(3)}% | CHOP: ${data.chop.toFixed(1)} | Trend: ${data.trend} | Momentum: ${data.momentum}
Price vs 20SMA: ${data.priceVsSMAPct.toFixed(2)}% | 1h Change: ${data.priceChange1h.toFixed(2)}%`;
    })
    .join("\n\n");

  let positionSection: string;
  if (ctx.currentPosition) {
    const p = ctx.currentPosition;
    positionSection = `Side: ${p.side.toUpperCase()} | Size: $${p.size.toFixed(2)} | Entry: $${p.entryPrice.toFixed(2)} | Unrealized PnL: $${p.pnl.toFixed(2)}`;
  } else {
    positionSection = "No open position";
  }

  let tradesSection = "No recent trades";
  if (ctx.recentTrades && ctx.recentTrades.length > 0) {
    const consecutiveLosses = ctx.recentTrades
      .slice(0, 5)
      .filter((t) => t.pnl < 0).length;
    tradesSection = ctx.recentTrades
      .slice(0, 5)
      .map((t) => `${t.side.toUpperCase()} | PnL: $${t.pnl.toFixed(2)} | ${t.openedAt}`)
      .join("\n");
    tradesSection += `\n\nConsecutive losses in last 5: ${consecutiveLosses}`;
  }

  return `## Market Analysis: ${ctx.symbol}
Current Price: $${ctx.currentPrice.toFixed(2)}
Risk Mode: ${ctx.riskMode.toUpperCase()} | Max Position: $${ctx.maxPositionUsd}

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
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1].trim());
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  throw new Error("No JSON found in LLM response");
}

export async function makeTradingDecision(
  ctx: BotContext
): Promise<TradingDecision> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing ANTHROPIC_API_KEY");
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemPrompt = ctx.systemPrompt?.trim() || DEFAULT_SYSTEM_PROMPT;
  const userMessage = buildUserMessage(ctx);

  const response = await client.messages.create({
    model: ctx.model,
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
    throw new Error(`Invalid decision value: ${decision}`);
  }

  const crvScore = Number(parsed.crv_score);
  if (isNaN(crvScore) || crvScore < 1 || crvScore > 5) {
    throw new Error(`Invalid CRV score: ${parsed.crv_score}`);
  }

  return {
    decision: decision as "buy" | "sell" | "hold",
    crvScore: Math.round(crvScore),
    reasoning: String(parsed.reasoning ?? ""),
    entryPrice:
      parsed.entry_price != null ? Number(parsed.entry_price) : undefined,
    stopLoss:
      parsed.stop_loss != null ? Number(parsed.stop_loss) : undefined,
    takeProfit:
      parsed.take_profit != null ? Number(parsed.take_profit) : undefined,
    promptTokens: response.usage.input_tokens,
  };
}
