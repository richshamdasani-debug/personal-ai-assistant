-- Trading Bot Schema Migration
-- Requires: uuid-ossp extension (already enabled in Supabase)

-- ── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE public.trading_bots (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  handle              text NOT NULL UNIQUE,
  name                text NOT NULL,
  model               text NOT NULL DEFAULT 'claude-haiku-4-5-20251001',
  symbol              text NOT NULL DEFAULT 'BTC',
  timeframes          text[] NOT NULL DEFAULT '{30m,4h,1d}',
  system_prompt       text,
  risk_mode           text NOT NULL DEFAULT 'moderate' CHECK (risk_mode IN ('conservative','moderate','aggressive')),
  max_position_usd    numeric(12,2) NOT NULL DEFAULT 100,
  mode                text NOT NULL DEFAULT 'server' CHECK (mode IN ('server','client')),
  status              text NOT NULL DEFAULT 'stopped' CHECK (status IN ('stopped','running','error')),
  hl_wallet_address   text,
  equity_usd          numeric(12,2),
  initial_equity_usd  numeric(12,2),
  total_trades        integer NOT NULL DEFAULT 0,
  total_prompts       integer NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.bot_trades (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id       uuid NOT NULL REFERENCES public.trading_bots(id) ON DELETE CASCADE,
  symbol       text NOT NULL,
  side         text NOT NULL CHECK (side IN ('buy','sell')),
  size_usd     numeric(12,2) NOT NULL,
  entry_price  numeric(20,6) NOT NULL,
  exit_price   numeric(20,6),
  pnl_usd      numeric(12,2),
  status       text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','cancelled')),
  hl_order_id  text,
  decision_id  uuid,
  opened_at    timestamptz NOT NULL DEFAULT now(),
  closed_at    timestamptz
);

CREATE TABLE public.bot_decisions (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_id              uuid NOT NULL REFERENCES public.trading_bots(id) ON DELETE CASCADE,
  symbol              text NOT NULL,
  decision            text NOT NULL CHECK (decision IN ('buy','sell','hold')),
  crv_score           integer NOT NULL CHECK (crv_score BETWEEN 1 AND 5),
  reasoning           text NOT NULL,
  prompt_tokens       integer,
  model               text,
  timeframe_data      jsonb,
  price_at_decision   numeric(20,6),
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_trading_bots_user_id ON public.trading_bots(user_id);
CREATE INDEX idx_trading_bots_status ON public.trading_bots(status);
CREATE INDEX idx_trading_bots_handle ON public.trading_bots(handle);

CREATE INDEX idx_bot_trades_bot_id ON public.bot_trades(bot_id);
CREATE INDEX idx_bot_trades_status ON public.bot_trades(status);
CREATE INDEX idx_bot_trades_opened_at ON public.bot_trades(opened_at DESC);

CREATE INDEX idx_bot_decisions_bot_id ON public.bot_decisions(bot_id);
CREATE INDEX idx_bot_decisions_created_at ON public.bot_decisions(created_at DESC);

-- ── Updated-at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trading_bots_updated_at
  BEFORE UPDATE ON public.trading_bots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE public.trading_bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_decisions ENABLE ROW LEVEL SECURITY;

-- trading_bots: users see only their own
CREATE POLICY "trading_bots_select_own"
  ON public.trading_bots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "trading_bots_insert_own"
  ON public.trading_bots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trading_bots_update_own"
  ON public.trading_bots FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "trading_bots_delete_own"
  ON public.trading_bots FOR DELETE
  USING (auth.uid() = user_id);

-- bot_trades: users see only trades for their bots
CREATE POLICY "bot_trades_select_own"
  ON public.bot_trades FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trading_bots b
      WHERE b.id = bot_trades.bot_id AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "bot_trades_insert_own"
  ON public.bot_trades FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trading_bots b
      WHERE b.id = bot_trades.bot_id AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "bot_trades_update_own"
  ON public.bot_trades FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trading_bots b
      WHERE b.id = bot_trades.bot_id AND b.user_id = auth.uid()
    )
  );

-- bot_decisions: users see only decisions for their bots
CREATE POLICY "bot_decisions_select_own"
  ON public.bot_decisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trading_bots b
      WHERE b.id = bot_decisions.bot_id AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "bot_decisions_insert_own"
  ON public.bot_decisions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trading_bots b
      WHERE b.id = bot_decisions.bot_id AND b.user_id = auth.uid()
    )
  );

-- ── Leaderboard View ─────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  b.id,
  b.handle,
  b.name,
  b.model,
  b.symbol,
  b.equity_usd,
  b.initial_equity_usd,
  CASE
    WHEN b.initial_equity_usd > 0
    THEN ROUND((b.equity_usd - b.initial_equity_usd) / b.initial_equity_usd * 100, 2)
    ELSE 0
  END AS roi_pct,
  (b.equity_usd - b.initial_equity_usd) AS pnl_usd,
  b.total_trades,
  b.total_prompts,
  b.status,
  b.created_at
FROM public.trading_bots b
WHERE b.equity_usd IS NOT NULL
ORDER BY roi_pct DESC;

-- Public read access on leaderboard (no auth required)
GRANT SELECT ON public.leaderboard TO anon, authenticated;
