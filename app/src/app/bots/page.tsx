import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import TopNav from "@/components/trading/TopNav";
import BotsClient from "./BotsClient";

// ── Types ──────────────────────────────────────────────────────────────────

export interface Bot {
  id: string;
  handle: string;
  name: string;
  status: "running" | "stopped" | "error";
  equity: number;
  roi: number;
  totalTrades: number;
  model: string;
  symbol: string;
  riskMode: "conservative" | "moderate" | "aggressive";
  maxPositionUsd: number;
  systemPrompt?: string;
  createdAt: string;
}

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_BOTS: Bot[] = [
  {
    id: "bot-1",
    handle: "alpha_macro",
    name: "Alpha Macro",
    status: "running",
    equity: 148320,
    roi: 48.32,
    totalTrades: 312,
    model: "claude-sonnet-4-6",
    symbol: "BTC",
    riskMode: "moderate",
    maxPositionUsd: 50000,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
  },
  {
    id: "bot-2",
    handle: "eth_swing",
    name: "ETH Swing",
    status: "stopped",
    equity: 32400,
    roi: -8.4,
    totalTrades: 87,
    model: "claude-haiku-4-5",
    symbol: "ETH",
    riskMode: "conservative",
    maxPositionUsd: 10000,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
  },
];

// ── Data fetching ──────────────────────────────────────────────────────────

async function fetchBots(token: string): Promise<Bot[]> {
  try {
    const res = await fetch("http://localhost:4000/api/bots", {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 0 },
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
    const res = await fetch("http://localhost:4000/api/trading/price/BTC", {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const d = await res.json();
    return typeof d.price === "number" ? d.price : null;
  } catch {
    return null;
  }
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function BotsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const token = (session as { accessToken?: string }).accessToken ?? "";
  const [bots, btcPrice] = await Promise.all([fetchBots(token), fetchBtcPrice()]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <TopNav activePage="bots" btcPrice={btcPrice} />

      <main className="max-w-screen-xl mx-auto w-full px-6 py-8 flex-1">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">My Bots</h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage your AI trading bots
            </p>
          </div>
        </div>

        <BotsClient initialBots={bots} />
      </main>
    </div>
  );
}
