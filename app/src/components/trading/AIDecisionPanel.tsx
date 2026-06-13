"use client";

import { useEffect, useState } from "react";

interface Decision {
  id: string;
  decision: "buy" | "sell" | "hold";
  crvScore: number;
  reasoning: string;
  model: string;
  priceAtDecision: number;
  createdAt: string;
}

interface AIDecisionPanelProps {
  botId?: string;
  symbol?: string;
  initialDecisions?: Decision[];
}

const MOCK_DECISIONS: Decision[] = [
  {
    id: "1",
    decision: "hold",
    crvScore: -5,
    reasoning:
      "Current market structure shows consolidation near the $94,200 resistance zone. Volume is declining on recent up-moves which suggests exhaustion. RSI at 58 is neutral. Waiting for a cleaner setup before entering. Key support at $91,800 needs to hold.",
    model: "claude-haiku-4-5",
    priceAtDecision: 94215.5,
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    id: "2",
    decision: "buy",
    crvScore: 7,
    reasoning:
      "Breakout confirmed above the $92,500 level with above-average volume. 4H candle closed above the 200 EMA for the first time in 3 weeks. Momentum indicators turning bullish. CRV 3.5:1 with stop below $91,200 and target at $96,800. Entering 40% position.",
    model: "claude-haiku-4-5",
    priceAtDecision: 92680.0,
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  },
  {
    id: "3",
    decision: "sell",
    crvScore: -8,
    reasoning:
      "Failed retest of the $95,000 level. Bearish engulfing on 4H with high volume. Macro environment showing risk-off signals. Reducing exposure by 60%. Stop at $95,400, target $89,500 for the short leg.",
    model: "claude-haiku-4-5",
    priceAtDecision: 94890.25,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "4",
    decision: "hold",
    crvScore: 2,
    reasoning:
      "Range-bound between $90,000 and $93,500. No clear directional bias on higher timeframes. Network metrics neutral. Holding current 20% position and waiting for range resolution before adding.",
    model: "claude-haiku-4-5",
    priceAtDecision: 91540.0,
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
  {
    id: "5",
    decision: "buy",
    crvScore: 9,
    reasoning:
      "Strong demand zone tested at $88,000 for the third time — each test showing diminishing sell pressure. On-chain data shows accumulation by long-term holders. Risk-reward 4:1. Full position entry with stop at $86,500.",
    model: "claude-haiku-4-5",
    priceAtDecision: 88240.75,
    createdAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
  },
];

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function DecisionCard({ decision }: { decision: Decision }) {
  const [expanded, setExpanded] = useState(false);

  const colorMap = {
    buy: {
      header: "text-green-400",
      bg: "bg-green-950/30 border-green-900/50",
      badge: "bg-green-900/50 text-green-400",
    },
    sell: {
      header: "text-red-400",
      bg: "bg-red-950/30 border-red-900/50",
      badge: "bg-red-900/50 text-red-400",
    },
    hold: {
      header: "text-slate-400",
      bg: "bg-slate-800/40 border-slate-700/50",
      badge: "bg-slate-700/50 text-slate-400",
    },
  };

  const colors = colorMap[decision.decision];
  const label = decision.decision.toUpperCase();
  const crvLabel =
    decision.crvScore > 0
      ? `+${decision.crvScore}`
      : String(decision.crvScore);

  const truncated = decision.reasoning.length > 140 && !expanded;
  const displayText = truncated
    ? decision.reasoning.slice(0, 140) + "..."
    : decision.reasoning;

  return (
    <div className={`rounded-lg border p-3 ${colors.bg}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`font-mono font-bold text-sm ${colors.header}`}>
          CRV: {label}-{Math.abs(decision.crvScore)}
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}>
          {crvLabel}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-slate-500">{formatTimeAgo(decision.createdAt)}</span>
        <span className="text-slate-700">·</span>
        <span className="text-xs text-slate-600">{decision.model}</span>
        <span className="text-slate-700">·</span>
        <span className="text-xs text-slate-500">
          ${decision.priceAtDecision.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        </span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">{displayText}</p>
      {decision.reasoning.length > 140 && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-xs text-indigo-400 mt-1.5 hover:text-indigo-300 transition-colors"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

export default function AIDecisionPanel({
  botId,
  symbol = "BTC",
  initialDecisions = [],
}: AIDecisionPanelProps) {
  const [decisions, setDecisions] = useState<Decision[]>(
    initialDecisions.length > 0 ? initialDecisions : MOCK_DECISIONS
  );
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    if (!botId) return;

    const fetchDecisions = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://localhost:4000/api/bots/${botId}/decisions`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setDecisions(data);
          }
        }
      } catch {
        // Keep existing decisions on error
      } finally {
        setLoading(false);
        setLastRefresh(new Date());
      }
    };

    fetchDecisions();
    const interval = setInterval(fetchDecisions, 30000);
    return () => clearInterval(interval);
  }, [botId]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm">AI Decisions</span>
          <span className="text-xs text-slate-600 font-mono">{symbol}</span>
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          )}
          <span className="text-xs text-slate-600">
            {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
        {decisions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <p className="text-slate-500 text-sm">No decisions yet</p>
            <p className="text-slate-600 text-xs">Start a bot to see AI decisions here</p>
          </div>
        ) : (
          decisions.map((d) => <DecisionCard key={d.id} decision={d} />)
        )}
      </div>

      <div className="px-4 py-2 border-t border-slate-800 shrink-0">
        <p className="text-xs text-slate-600">
          Auto-refreshes every 30s
          {botId && (
            <span className="ml-1 text-indigo-600"> · Live feed active</span>
          )}
        </p>
      </div>
    </div>
  );
}
