"use client";

import { useState } from "react";
import type { Bot } from "./page";

// ── Constants ──────────────────────────────────────────────────────────────

const MODELS = [
  { value: "claude-haiku-4-5-20251001", label: "claude-haiku-4-5" },
  { value: "claude-sonnet-4-6", label: "claude-sonnet-4-6" },
  { value: "claude-opus-4-8", label: "claude-opus-4-8" },
];

const SYMBOLS = ["BTC", "ETH", "SOL", "ARB", "AVAX", "XMR", "DOGE", "LINK", "MATIC", "OP"];

const RISK_MODES = [
  { value: "conservative", label: "Conservative" },
  { value: "moderate", label: "Moderate" },
  { value: "aggressive", label: "Aggressive" },
];

const MODEL_COLORS: Record<string, string> = {
  "claude-haiku-4-5": "bg-slate-800 text-slate-300",
  "claude-haiku-4-5-20251001": "bg-slate-800 text-slate-300",
  "claude-sonnet-4-6": "bg-indigo-950 text-indigo-300",
  "claude-opus-4-8": "bg-violet-950 text-violet-300",
};

const STATUS_STYLES: Record<Bot["status"], { dot: string; bg: string; text: string; label: string }> = {
  running: {
    dot: "bg-green-400",
    bg: "bg-green-950/40 border-green-800/50",
    text: "text-green-400",
    label: "Running",
  },
  stopped: {
    dot: "bg-slate-500",
    bg: "bg-slate-800/40 border-slate-700/50",
    text: "text-slate-400",
    label: "Stopped",
  },
  error: {
    dot: "bg-red-400",
    bg: "bg-red-950/40 border-red-800/50",
    text: "text-red-400",
    label: "Error",
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtUSD(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

function shortModel(m: string) {
  // strip date suffix if present
  return m.replace(/-\d{8}$/, "");
}

// ── Create Bot Form ────────────────────────────────────────────────────────

interface CreateBotForm {
  handle: string;
  name: string;
  model: string;
  symbol: string;
  riskMode: "conservative" | "moderate" | "aggressive";
  maxPositionUsd: string;
  systemPrompt: string;
}

const DEFAULT_FORM: CreateBotForm = {
  handle: "",
  name: "",
  model: "claude-haiku-4-5-20251001",
  symbol: "BTC",
  riskMode: "moderate",
  maxPositionUsd: "10000",
  systemPrompt: "",
};

function CreateBotModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (bot: Bot) => void;
}) {
  const [form, setForm] = useState<CreateBotForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof CreateBotForm>(k: K, v: CreateBotForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.handle.match(/^[a-zA-Z0-9_]+$/)) {
      setError("Handle must be alphanumeric (underscores allowed).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: form.handle,
          name: form.name,
          model: form.model,
          symbol: form.symbol,
          riskMode: form.riskMode,
          maxPositionUsd: parseFloat(form.maxPositionUsd),
          systemPrompt: form.systemPrompt || undefined,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Failed to create bot.");
        return;
      }

      const newBot: Bot = await res.json().catch(() => ({
        id: `bot-${Date.now()}`,
        handle: form.handle,
        name: form.name,
        status: "stopped" as const,
        equity: 100000,
        roi: 0,
        totalTrades: 0,
        model: form.model,
        symbol: form.symbol,
        riskMode: form.riskMode,
        maxPositionUsd: parseFloat(form.maxPositionUsd),
        systemPrompt: form.systemPrompt || undefined,
        createdAt: new Date().toISOString(),
      }));

      onCreate(newBot);
      onClose();
    } catch {
      // API unreachable — add optimistically
      onCreate({
        id: `bot-${Date.now()}`,
        handle: form.handle,
        name: form.name,
        status: "stopped",
        equity: 100000,
        roi: 0,
        totalTrades: 0,
        model: form.model,
        symbol: form.symbol,
        riskMode: form.riskMode,
        maxPositionUsd: parseFloat(form.maxPositionUsd),
        systemPrompt: form.systemPrompt || undefined,
        createdAt: new Date().toISOString(),
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="font-bold text-white text-lg">Create Bot</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-950/60 border border-red-800/50 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-1.5 uppercase tracking-wide">
                Handle
              </label>
              <input
                type="text"
                required
                placeholder="my_bot"
                value={form.handle}
                onChange={(e) => set("handle", e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-1.5 uppercase tracking-wide">
                Name
              </label>
              <input
                type="text"
                required
                placeholder="My Trading Bot"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 font-semibold mb-1.5 uppercase tracking-wide">
              Model
            </label>
            <select
              value={form.model}
              onChange={(e) => set("model", e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-1.5 uppercase tracking-wide">
                Symbol
              </label>
              <select
                value={form.symbol}
                onChange={(e) => set("symbol", e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {SYMBOLS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-1.5 uppercase tracking-wide">
                Risk Mode
              </label>
              <select
                value={form.riskMode}
                onChange={(e) =>
                  set("riskMode", e.target.value as CreateBotForm["riskMode"])
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {RISK_MODES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 font-semibold mb-1.5 uppercase tracking-wide">
              Max Position (USD)
            </label>
            <input
              type="number"
              required
              min={100}
              step={100}
              value={form.maxPositionUsd}
              onChange={(e) => set("maxPositionUsd", e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 font-semibold mb-1.5 uppercase tracking-wide">
              System Prompt{" "}
              <span className="text-slate-600 normal-case font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Custom instructions for the trading bot..."
              value={form.systemPrompt}
              onChange={(e) => set("systemPrompt", e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          <div className="pt-1 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm py-2.5 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
            >
              {loading ? "Creating..." : "Create Bot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Bot Card ───────────────────────────────────────────────────────────────

function BotCard({
  bot,
  onToggle,
  onDelete,
}: {
  bot: Bot;
  onToggle: (id: string, action: "start" | "stop") => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const status = STATUS_STYLES[bot.status];
  const modelColor = MODEL_COLORS[shortModel(bot.model)] ?? "bg-slate-800 text-slate-400";
  const roiPos = bot.roi >= 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-white text-base">@{bot.handle}</span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${status.bg} ${status.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
          <p className="text-slate-500 text-xs">{bot.name}</p>
        </div>
        <span
          className={`text-xs font-mono px-2 py-1 rounded-md ${modelColor}`}
        >
          {shortModel(bot.model)}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Equity</p>
          <p className="text-sm font-semibold text-white">{fmtUSD(bot.equity)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-0.5">ROI</p>
          <p
            className={`text-sm font-semibold ${roiPos ? "text-green-400" : "text-red-400"}`}
          >
            {roiPos ? "+" : ""}
            {bot.roi.toFixed(2)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Trades</p>
          <p className="text-sm font-semibold text-white">
            {bot.totalTrades.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Meta tags */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
          {bot.symbol}/USD
        </span>
        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md capitalize">
          {bot.riskMode}
        </span>
        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
          Max {fmtUSD(bot.maxPositionUsd)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {bot.status === "running" ? (
          <button
            onClick={() => onToggle(bot.id, "stop")}
            className="flex-1 text-xs font-semibold py-2 rounded-lg bg-red-950/40 text-red-400 border border-red-900/50 hover:bg-red-950/70 transition-colors"
          >
            Stop
          </button>
        ) : (
          <button
            onClick={() => onToggle(bot.id, "start")}
            className="flex-1 text-xs font-semibold py-2 rounded-lg bg-green-950/40 text-green-400 border border-green-900/50 hover:bg-green-950/70 transition-colors"
          >
            Start
          </button>
        )}
        <button className="flex-1 text-xs font-semibold py-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors">
          Edit
        </button>
        {confirmDelete ? (
          <button
            onClick={() => onDelete(bot.id)}
            className="flex-1 text-xs font-semibold py-2 rounded-lg bg-red-600 text-white border border-red-500 hover:bg-red-500 transition-colors"
          >
            Confirm
          </button>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            onBlur={() => setConfirmDelete(false)}
            className="flex-1 text-xs font-semibold py-2 rounded-lg bg-slate-800 text-slate-500 border border-slate-700 hover:text-red-400 hover:border-red-900 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Client Component ──────────────────────────────────────────────────

export default function BotsClient({ initialBots }: { initialBots: Bot[] }) {
  const [bots, setBots] = useState<Bot[]>(initialBots);
  const [showCreate, setShowCreate] = useState(false);

  const handleToggle = async (id: string, action: "start" | "stop") => {
    // Optimistic update
    setBots((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: action === "start" ? "running" : "stopped" } : b
      )
    );

    try {
      await fetch(`http://localhost:4000/api/bots/${id}/${action}`, {
        method: "POST",
      });
    } catch {
      // Keep optimistic state
    }
  };

  const handleDelete = async (id: string) => {
    setBots((prev) => prev.filter((b) => b.id !== id));
    try {
      await fetch(`http://localhost:4000/api/bots/${id}`, { method: "DELETE" });
    } catch {
      // Already removed from UI
    }
  };

  const handleCreate = (bot: Bot) => {
    setBots((prev) => [...prev, bot]);
  };

  return (
    <>
      {/* Create button row */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowCreate(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"
        >
          + Create Bot
        </button>
      </div>

      {/* Bot list */}
      {bots.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-slate-400 font-medium">No bots yet</p>
          <p className="text-slate-600 text-sm">
            Create your first AI trading bot to get started.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            Create Bot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {bots.map((bot) => (
            <BotCard
              key={bot.id}
              bot={bot}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showCreate && (
        <CreateBotModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </>
  );
}
