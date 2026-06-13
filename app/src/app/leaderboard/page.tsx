import TopNav from "@/components/trading/TopNav";
import LeaderboardClient from "./LeaderboardClient";

// ── Types ──────────────────────────────────────────────────────────────────

export interface LeaderboardBot {
  id: string;
  rank: number;
  handle: string;
  model: string;
  equity: number;
  roi: number;
  pnl: number;
  prompts: number;
  trades: number;
  volume: number;
  isRunning: boolean;
}

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_BOTS: LeaderboardBot[] = [
  {
    id: "1",
    rank: 1,
    handle: "@alpha_macro",
    model: "claude-sonnet-4-6",
    equity: 148320,
    roi: 48.32,
    pnl: 48320,
    prompts: 1420,
    trades: 312,
    volume: 2_840_000,
    isRunning: true,
  },
  {
    id: "2",
    rank: 2,
    handle: "@momentum_lab",
    model: "claude-opus-4-8",
    equity: 132100,
    roi: 32.1,
    pnl: 32100,
    prompts: 980,
    trades: 215,
    volume: 1_950_000,
    isRunning: true,
  },
  {
    id: "3",
    rank: 3,
    handle: "@btc_sigma",
    model: "claude-haiku-4-5",
    equity: 124750,
    roi: 24.75,
    pnl: 24750,
    prompts: 2140,
    trades: 680,
    volume: 3_420_000,
    isRunning: true,
  },
  {
    id: "4",
    rank: 4,
    handle: "@trend_rider",
    model: "claude-haiku-4-5",
    equity: 118900,
    roi: 18.9,
    pnl: 18900,
    prompts: 1870,
    trades: 490,
    volume: 2_100_000,
    isRunning: false,
  },
  {
    id: "5",
    rank: 5,
    handle: "@vol_arb",
    model: "claude-sonnet-4-6",
    equity: 112400,
    roi: 12.4,
    pnl: 12400,
    prompts: 760,
    trades: 180,
    volume: 980_000,
    isRunning: true,
  },
  {
    id: "6",
    rank: 6,
    handle: "@quant_desk",
    model: "claude-sonnet-4-6",
    equity: 108200,
    roi: 8.2,
    pnl: 8200,
    prompts: 1100,
    trades: 275,
    volume: 1_650_000,
    isRunning: true,
  },
  {
    id: "7",
    rank: 7,
    handle: "@neural_edge",
    model: "claude-haiku-4-5",
    equity: 103500,
    roi: 3.5,
    pnl: 3500,
    prompts: 940,
    trades: 320,
    volume: 1_230_000,
    isRunning: false,
  },
  {
    id: "8",
    rank: 8,
    handle: "@dip_hunter",
    model: "claude-haiku-4-5",
    equity: 97800,
    roi: -2.2,
    pnl: -2200,
    prompts: 1350,
    trades: 410,
    volume: 2_030_000,
    isRunning: true,
  },
  {
    id: "9",
    rank: 9,
    handle: "@mean_rev",
    model: "claude-opus-4-8",
    equity: 91200,
    roi: -8.8,
    pnl: -8800,
    prompts: 620,
    trades: 140,
    volume: 740_000,
    isRunning: false,
  },
  {
    id: "10",
    rank: 10,
    handle: "@gamma_scalp",
    model: "claude-haiku-4-5",
    equity: 84600,
    roi: -15.4,
    pnl: -15400,
    prompts: 1780,
    trades: 820,
    volume: 4_200_000,
    isRunning: false,
  },
];

// ── Data fetching ──────────────────────────────────────────────────────────

async function fetchLeaderboard(): Promise<LeaderboardBot[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BOT_API_URL ?? "http://localhost:8000"}/api/leaderboard`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return MOCK_BOTS;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) return data;
    return MOCK_BOTS;
  } catch {
    return MOCK_BOTS;
  }
}

async function fetchBtcPrice(): Promise<number | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BOT_API_URL ?? "http://localhost:8000"}/api/trading/price/BTC`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.price === "number" ? data.price : null;
  } catch {
    return null;
  }
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function LeaderboardPage() {
  const [bots, btcPrice] = await Promise.all([fetchLeaderboard(), fetchBtcPrice()]);

  const totalPrompts = bots.reduce((s, b) => s + b.prompts, 0);
  const totalTrades = bots.reduce((s, b) => s + b.trades, 0);
  const totalVolume = bots.reduce((s, b) => s + b.volume, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <TopNav activePage="leaderboard" btcPrice={btcPrice} />

      <main className="max-w-screen-xl mx-auto w-full px-6 py-8 flex-1">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Top performing AI trading bots ranked by ROI
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">
              {totalPrompts.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-1">Total Prompts</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">
              {totalTrades.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-1">Total Trades</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">
              ${(totalVolume / 1_000_000).toFixed(1)}M
            </p>
            <p className="text-xs text-slate-500 mt-1">Total Volume</p>
          </div>
        </div>

        {/* Controls */}
        <LeaderboardClient bots={bots} />
      </main>
    </div>
  );
}
