import asyncio
import logging
from datetime import datetime
from typing import Optional

from bot.db.supabase import get_supabase
from bot.services.hyperliquid import HyperliquidClient
from bot.services.indicators import analyze_timeframe
from bot.services.llm import LLMClient, TradingDecision

logger = logging.getLogger(__name__)


class TradingBot:
    def __init__(self, bot_id: str, config: dict) -> None:
        """
        config keys: handle, symbol, timeframes, model, llm_provider,
                     risk_mode, max_position_usd, system_prompt,
                     hl_wallet_address, hl_private_key (optional)
        """
        self.bot_id = bot_id
        self.config = config
        self.running = False
        self._task: Optional[asyncio.Task] = None  # type: ignore[type-arg]

        self.hl = HyperliquidClient(
            wallet_address=config.get("hl_wallet_address"),
            private_key=config.get("hl_private_key"),
        )
        self.llm = LLMClient(
            provider=config.get("llm_provider", "ollama"),
            model=config.get("model", "gemma3:27b"),
        )
        self.supabase = get_supabase()

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def start(self, interval_seconds: int = 900) -> None:
        self.running = True
        self._task = asyncio.create_task(self._loop(interval_seconds))
        logger.info(
            f"Bot {self.config['handle']} started (interval={interval_seconds}s)"
        )

    async def stop(self) -> None:
        self.running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info(f"Bot {self.config['handle']} stopped")

    # ------------------------------------------------------------------
    # Main loop
    # ------------------------------------------------------------------

    async def _loop(self, interval_seconds: int) -> None:
        while self.running:
            try:
                await self._tick()
            except Exception as exc:
                logger.error(
                    f"Bot {self.config['handle']} tick error: {exc}", exc_info=True
                )
                self._set_status("error")
                break
            await asyncio.sleep(interval_seconds)

    async def _tick(self) -> None:
        symbol: str = self.config["symbol"]
        timeframes: list[str] = self.config.get("timeframes", ["30m", "4h", "1d"])

        # 1. Fetch candles for each timeframe and run indicator analysis
        timeframe_data: dict = {}
        for tf in timeframes:
            candles = self.hl.get_candles(symbol, tf, lookback=100)
            if candles:
                candle_dicts = [
                    {"o": c.o, "h": c.h, "l": c.l, "c": c.c, "v": c.v}
                    for c in candles
                ]
                analysis = analyze_timeframe(candle_dicts, tf)
                timeframe_data[tf] = analysis

        if not timeframe_data:
            logger.warning(f"No timeframe data for {symbol}")
            return

        # 2. Get current price
        current_price = self.hl.get_price(symbol)

        # 3. Get current account state and open position (if wallet configured)
        position = None
        equity: float | None = None
        if self.config.get("hl_wallet_address"):
            try:
                account = self.hl.get_account_state(self.config["hl_wallet_address"])
                equity = account.account_value
                position = next(
                    (p for p in account.positions if p.coin == symbol and p.size != 0),
                    None,
                )
            except Exception as exc:
                logger.warning(f"Could not fetch account state: {exc}")

        # 4. Recent decisions for consecutive loss counting
        recent_decisions = self._get_recent_decisions(limit=10)
        consecutive_losses = self._count_consecutive_losses(recent_decisions)

        # 5. Build context and get LLM trading decision
        context: dict = {
            "symbol": symbol,
            "price": current_price,
            "timestamp": datetime.utcnow().isoformat(),
            "risk_mode": self.config.get("risk_mode", "moderate"),
            "max_position_usd": self.config.get("max_position_usd", 100),
            "timeframe_data": {tf: vars(analysis) for tf, analysis in timeframe_data.items()},
            "position": (
                {
                    "side": "long" if position.size > 0 else "short",
                    "size": abs(position.size),
                    "entry_price": position.entry_price,
                    "unrealized_pnl": position.unrealized_pnl,
                }
                if position and position.size != 0
                else None
            ),
            "consecutive_losses": consecutive_losses,
            "system_prompt": self.config.get("system_prompt"),
        }

        decision: TradingDecision = await self.llm.make_trading_decision(context)

        # 6. Log decision to Supabase
        decision_id = self._log_decision(decision, current_price, timeframe_data)

        # 7. Update bot equity stats
        self._update_bot_stats(equity=equity)

        # 8. Open paper trade on high-conviction signal with no current position
        if decision.crv_score <= 2 and decision.decision in ("buy", "sell"):
            if not position or position.size == 0:
                self._open_paper_trade(decision, current_price, decision_id)

        # 9. Close paper trade if decision flips against current position
        if position and position.size != 0:
            should_close = (
                decision.decision == "sell" and position.size > 0
            ) or (
                decision.decision == "buy" and position.size < 0
            )
            if should_close and decision.crv_score <= 3:
                self._close_paper_trade(symbol, current_price)

        logger.info(
            f"[{self.config['handle']}] {symbol} @ ${current_price:.2f} "
            f"→ {decision.decision.upper()}-{decision.crv_score}"
        )

    # ------------------------------------------------------------------
    # Supabase helpers
    # ------------------------------------------------------------------

    def _get_recent_decisions(self, limit: int = 10) -> list[dict]:
        result = (
            self.supabase.table("bot_decisions")
            .select("decision,crv_score,created_at")
            .eq("bot_id", self.bot_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []

    def _count_consecutive_losses(self, decisions: list[dict]) -> int:
        """
        Count consecutive 'sell' decisions with crv_score <= 2 from most recent.
        These are treated as recent high-conviction sells (potential losses on a
        long-biased strategy).
        """
        count = 0
        for d in decisions:
            if d.get("decision") == "sell" and d.get("crv_score", 5) <= 2:
                count += 1
            else:
                break
        return count

    def _log_decision(
        self,
        decision: TradingDecision,
        price: float,
        timeframe_data: dict,
    ) -> str | None:
        result = (
            self.supabase.table("bot_decisions")
            .insert(
                {
                    "bot_id": self.bot_id,
                    "symbol": self.config["symbol"],
                    "decision": decision.decision,
                    "crv_score": decision.crv_score,
                    "reasoning": decision.reasoning,
                    "prompt_tokens": decision.prompt_tokens,
                    "model": self.config.get("model"),
                    "price_at_decision": price,
                    "timeframe_data": {
                        tf: vars(analysis) for tf, analysis in timeframe_data.items()
                    },
                }
            )
            .execute()
        )

        # Increment total_prompts counter
        try:
            current = (
                self.supabase.table("trading_bots")
                .select("total_prompts")
                .eq("id", self.bot_id)
                .single()
                .execute()
            )
            new_count = (current.data.get("total_prompts") or 0) + 1
            self.supabase.table("trading_bots").update(
                {
                    "total_prompts": new_count,
                    "updated_at": datetime.utcnow().isoformat(),
                }
            ).eq("id", self.bot_id).execute()
        except Exception as exc:
            logger.warning(f"Could not update total_prompts: {exc}")

        return result.data[0]["id"] if result.data else None

    def _update_bot_stats(self, equity: float | None) -> None:
        if equity is not None:
            self.supabase.table("trading_bots").update(
                {
                    "equity_usd": equity,
                    "updated_at": datetime.utcnow().isoformat(),
                }
            ).eq("id", self.bot_id).execute()

    def _open_paper_trade(
        self,
        decision: TradingDecision,
        price: float,
        decision_id: str | None,
    ) -> None:
        try:
            current = (
                self.supabase.table("trading_bots")
                .select("total_trades")
                .eq("id", self.bot_id)
                .single()
                .execute()
            )
            new_count = (current.data.get("total_trades") or 0) + 1
        except Exception:
            new_count = 1

        self.supabase.table("bot_trades").insert(
            {
                "bot_id": self.bot_id,
                "symbol": self.config["symbol"],
                "side": decision.decision,   # "buy" or "sell"
                "size_usd": self.config.get("max_position_usd", 100),
                "entry_price": price,
                "status": "open",
                "decision_id": decision_id,
            }
        ).execute()

        self.supabase.table("trading_bots").update(
            {"total_trades": new_count}
        ).eq("id", self.bot_id).execute()

    def _close_paper_trade(self, symbol: str, current_price: float) -> None:
        open_trades = (
            self.supabase.table("bot_trades")
            .select("*")
            .eq("bot_id", self.bot_id)
            .eq("symbol", symbol)
            .eq("status", "open")
            .execute()
        )

        for trade in open_trades.data or []:
            entry = float(trade["entry_price"])
            side = trade["side"]
            size_usd = float(trade["size_usd"])

            if side == "buy":
                pnl = (current_price - entry) / entry * size_usd
            else:
                pnl = (entry - current_price) / entry * size_usd

            self.supabase.table("bot_trades").update(
                {
                    "exit_price": current_price,
                    "pnl_usd": pnl,
                    "status": "closed",
                    "closed_at": datetime.utcnow().isoformat(),
                }
            ).eq("id", trade["id"]).execute()

    def _set_status(self, status: str) -> None:
        try:
            self.supabase.table("trading_bots").update(
                {
                    "status": status,
                    "updated_at": datetime.utcnow().isoformat(),
                }
            ).eq("id", self.bot_id).execute()
        except Exception as exc:
            logger.error(f"Could not set bot status to '{status}': {exc}")
