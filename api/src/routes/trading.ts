import { Router } from "express";
import {
  getPrice,
  getCandles,
  getAvailableCoins,
} from "../services/hyperliquid.js";
import { supabase } from "../services/supabase.js";

export const tradingRouter = Router();

// GET /api/trading/price/:symbol
tradingRouter.get("/price/:symbol", async (req, res) => {
  const { symbol } = req.params;

  try {
    const price = await getPrice(symbol.toUpperCase());
    res.json({ symbol: symbol.toUpperCase(), price });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch price";
    res.status(502).json({ error: message });
  }
});

// GET /api/trading/candles/:symbol
tradingRouter.get("/candles/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const interval = String(req.query.interval ?? "1h");
  const lookback = Math.min(
    500,
    Math.max(1, parseInt(String(req.query.lookback ?? "100"), 10))
  );

  try {
    const candles = await getCandles(symbol.toUpperCase(), interval, lookback);
    res.json({ symbol: symbol.toUpperCase(), interval, candles });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch candles";
    res.status(502).json({ error: message });
  }
});

// GET /api/trading/symbols
tradingRouter.get("/symbols", async (_req, res) => {
  try {
    const coins = await getAvailableCoins();
    res.json({ symbols: coins });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch symbols";
    res.status(502).json({ error: message });
  }
});

// GET /api/leaderboard
// Also handles GET /api/trading/leaderboard if mounted under tradingRouter
tradingRouter.get("/leaderboard", async (req, res) => {
  const sort = String(req.query.sort ?? "roi");

  const validSortColumns: Record<string, string> = {
    roi: "roi_pct",
    pnl: "pnl_usd",
    trades: "total_trades",
    equity: "equity_usd",
  };

  const sortColumn = validSortColumns[sort] ?? "roi_pct";

  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order(sortColumn, { ascending: false })
    .limit(100);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ leaderboard: data ?? [] });
});
