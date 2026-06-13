"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import AIDecisionPanel from "@/components/trading/AIDecisionPanel";

// Dynamic import for TradingChart to avoid SSR issues with lightweight-charts
const TradingChart = dynamic(
  () => import("@/components/trading/TradingChart"),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

// ── Types ──────────────────────────────────────────────────────────────────

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

// ── Constants ──────────────────────────────────────────────────────────────

const SYMBOLS = ["BTC", "ETH", "SOL", "XMR", "ARB", "AVAX", "DOGE", "LINK"];
const TIMEFRAMES = ["1h", "4h", "1d", "1w"];

// ── Mock candles ───────────────────────────────────────────────────────────

function generateMockCandles(symbol: string, interval: string): Candle[] {
  const candles: Candle[] = [];
  const basePrice =
    symbol === "BTC"
      ? 94000
      : symbol === "ETH"
      ? 3400
      : symbol === "SOL"
      ? 185
      : symbol === "XMR"
      ? 165
      : 50;

  const intervalSeconds =
    interval === "1h"
      ? 3600
      : interval === "4h"
      ? 14400
      : interval === "1d"
      ? 86400
      : 604800;

  const count = 200;
  const now = Math.floor(Date.now() / 1000);
  const start = now - count * intervalSeconds;

  let price = basePrice;

  for (let i = 0; i < count; i++) {
    const t = start + i * intervalSeconds;
    const change = (Math.random() - 0.495) * price * 0.025;
    const open = price;
    price += change;
    const high = Math.max(open, price) * (1 + Math.random() * 0.008);
    const low = Math.min(open, price) * (1 - Math.random() * 0.008);
    candles.push({
      time: t,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(price.toFixed(2)),
    });
  }

  return candles;
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="w-full h-full bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500 text-sm">Loading chart...</span>
      </div>
    </div>
  );
}

// ── Order/Position Panel ───────────────────────────────────────────────────

function OrderPanel({ symbol }: { symbol: string }) {
  return (
    <div className="border-t border-slate-800">
      <div className="px-4 py-3 border-b border-slate-800">
        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
          Position
        </span>
      </div>
      <div className="px-4 py-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">Symbol</span>
          <span className="text-xs font-mono text-white">{symbol}/USD</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">Side</span>
          <span className="text-xs font-semibold text-green-400">LONG</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">Size</span>
          <span className="text-xs font-mono text-white">0.42</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">Entry</span>
          <span className="text-xs font-mono text-white">$91,240</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">Unrealized PnL</span>
          <span className="text-xs font-mono text-green-400">+$1,242</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">Liq. Price</span>
          <span className="text-xs font-mono text-red-400">$82,100</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function TradePage() {
  const [symbol, setSymbol] = useState("BTC");
  const [timeframe, setTimeframe] = useState("4h");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loadingCandles, setLoadingCandles] = useState(true);

  const fetchCandles = useCallback(async (sym: string, tf: string) => {
    setLoadingCandles(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BOT_API_URL ?? "http://localhost:8000"}/api/trading/candles/${sym}?interval=${tf}&lookback=200`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCandles(data);
          return;
        }
      }
    } catch {
      // fall through to mock
    }
    // Fallback to mock data
    setCandles(generateMockCandles(sym, tf));
  }, []);

  useEffect(() => {
    fetchCandles(symbol, timeframe);
  }, [symbol, timeframe, fetchCandles]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Symbol + timeframe bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800 bg-slate-950 shrink-0 overflow-x-auto">
        {/* Symbol tabs */}
        <div className="flex items-center gap-1">
          {SYMBOLS.map((s) => (
            <button
              key={s}
              onClick={() => setSymbol(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                symbol === s
                  ? "bg-slate-800 text-white"
                  : "text-slate-500 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-slate-800 mx-1 shrink-0" />

        {/* Timeframe buttons */}
        <div className="flex items-center gap-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`text-xs font-mono font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                timeframe === tf
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-700/50"
                  : "text-slate-500 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Loading indicator */}
        {loadingCandles && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0" />
        )}
      </div>

      {/* Main content: chart + AI panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chart — 65% */}
        <div className="flex-[65] bg-slate-950 border-r border-slate-800 overflow-hidden relative">
          <TradingChart
            candles={candles}
            symbol={symbol}
            interval={timeframe}
          />
        </div>

        {/* Right panel — 35% */}
        <div className="flex-[35] flex flex-col overflow-hidden min-w-0 bg-slate-950">
          {/* AI panel header */}
          <div className="px-4 pt-3 pb-0 shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-white font-bold text-sm">AI</span>
              <span className="text-xs font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-md">
                claude-haiku-4-5
              </span>
            </div>
          </div>

          {/* AI Decisions — fills available space */}
          <div className="flex-1 overflow-hidden min-h-0">
            <AIDecisionPanel symbol={symbol} />
          </div>

          {/* Position / order panel */}
          <div className="shrink-0">
            <OrderPanel symbol={symbol} />
          </div>
        </div>
      </div>
    </div>
  );
}
