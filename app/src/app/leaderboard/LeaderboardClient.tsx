"use client";

import { useState } from "react";
import type { LeaderboardBot } from "./page";

type TimeFilter = "24H" | "7D" | "30D" | "90D" | "All";

const TIME_FILTERS: TimeFilter[] = ["24H", "7D", "30D", "90D", "All"];

const MODEL_COLORS: Record<string, string> = {
  "claude-haiku-4-5": "bg-slate-800 text-slate-300",
  "claude-sonnet-4-6": "bg-indigo-950 text-indigo-300",
  "claude-opus-4-8": "bg-violet-950 text-violet-300",
};

const RANK_MEDALS: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

function fmt(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtUSD(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${fmt(n)}`;
}

export default function LeaderboardClient({ bots }: { bots: LeaderboardBot[] }) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("30D");
  const [runningOnly, setRunningOnly] = useState(false);

  const filtered = bots.filter((b) => !runningOnly || b.isRunning);

  return (
    <div>
      {/* Time filter + toggle row */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
          {TIME_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setTimeFilter(t)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                timeFilter === t
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-sm text-slate-400">Running bots only</span>
          <button
            role="switch"
            aria-checked={runningOnly}
            onClick={() => setRunningOnly((v) => !v)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              runningOnly ? "bg-indigo-600" : "bg-slate-700"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                runningOnly ? "translate-x-4" : "translate-x-1"
              }`}
            />
          </button>
        </label>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-slate-400 font-medium">No bots yet</p>
          <p className="text-slate-600 text-sm">
            Create a bot on the{" "}
            <a href="/bots" className="text-indigo-400 hover:text-indigo-300">
              Bots page
            </a>{" "}
            to get started.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3 uppercase tracking-wide">
                    Rank
                  </th>
                  <th className="text-left text-xs text-slate-500 font-semibold px-4 py-3 uppercase tracking-wide">
                    Trader
                  </th>
                  <th className="text-right text-xs text-slate-500 font-semibold px-4 py-3 uppercase tracking-wide">
                    Equity
                  </th>
                  <th className="text-right text-xs text-slate-500 font-semibold px-4 py-3 uppercase tracking-wide">
                    ROI
                  </th>
                  <th className="text-right text-xs text-slate-500 font-semibold px-4 py-3 uppercase tracking-wide">
                    PnL
                  </th>
                  <th className="text-right text-xs text-slate-500 font-semibold px-4 py-3 uppercase tracking-wide">
                    Prompts
                  </th>
                  <th className="text-right text-xs text-slate-500 font-semibold px-4 py-3 uppercase tracking-wide">
                    Trades
                  </th>
                  <th className="text-right text-xs text-slate-500 font-semibold px-4 py-3 uppercase tracking-wide">
                    Volume
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((bot) => {
                  const medal = RANK_MEDALS[bot.rank];
                  const modelColor =
                    MODEL_COLORS[bot.model] ?? "bg-slate-800 text-slate-400";
                  const roiPositive = bot.roi >= 0;
                  const pnlPositive = bot.pnl >= 0;

                  return (
                    <tr
                      key={bot.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Rank */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {medal ? (
                            <span className="text-base leading-none">{medal}</span>
                          ) : (
                            <span className="text-slate-500 font-mono text-sm w-5 text-center">
                              {bot.rank}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Trader */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white text-sm">
                                {bot.handle}
                              </span>
                              {bot.isRunning && (
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                              )}
                            </div>
                            <span
                              className={`text-xs font-mono px-1.5 py-0.5 rounded-md ${modelColor}`}
                            >
                              {bot.model}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Equity */}
                      <td className="px-4 py-3.5 text-right font-mono text-white text-sm">
                        {fmtUSD(bot.equity)}
                      </td>

                      {/* ROI */}
                      <td className="px-4 py-3.5 text-right">
                        <span
                          className={`font-semibold font-mono text-sm ${
                            roiPositive ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {roiPositive ? "+" : ""}
                          {bot.roi.toFixed(2)}%
                        </span>
                      </td>

                      {/* PnL */}
                      <td className="px-4 py-3.5 text-right">
                        <span
                          className={`font-mono text-sm ${
                            pnlPositive ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {pnlPositive ? "+" : ""}
                          {fmtUSD(bot.pnl)}
                        </span>
                      </td>

                      {/* Prompts */}
                      <td className="px-4 py-3.5 text-right font-mono text-slate-400 text-sm">
                        {fmt(bot.prompts)}
                      </td>

                      {/* Trades */}
                      <td className="px-4 py-3.5 text-right font-mono text-slate-400 text-sm">
                        {fmt(bot.trades)}
                      </td>

                      {/* Volume */}
                      <td className="px-4 py-3.5 text-right font-mono text-slate-400 text-sm">
                        {fmtUSD(bot.volume)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
