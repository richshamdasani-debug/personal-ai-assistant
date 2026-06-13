import asyncio
import logging

from bot.bot.trading_bot import TradingBot
from bot.db.supabase import get_supabase

logger = logging.getLogger(__name__)


class BotRunner:
    """Manages the lifecycle of multiple TradingBot instances.

    Polls Supabase every 30 seconds for bots with status='running' and
    mode='server', starting new ones and stopping removed ones automatically.
    """

    def __init__(self) -> None:
        self._bots: dict[str, TradingBot] = {}
        self._running = False
        self.supabase = get_supabase()

    async def start(self) -> None:
        """Start the BotRunner sync loop as a background task."""
        self._running = True
        logger.info("BotRunner started")
        asyncio.create_task(self._sync_loop())

    async def stop(self) -> None:
        """Stop all managed bots and the sync loop."""
        self._running = False
        for bot in list(self._bots.values()):
            await bot.stop()
        self._bots.clear()
        logger.info("BotRunner stopped")

    async def _sync_loop(self) -> None:
        """Continuously reconcile running bots against Supabase state."""
        while self._running:
            try:
                await self._sync_running_bots()
            except Exception as exc:
                logger.error(f"BotRunner sync error: {exc}", exc_info=True)
            await asyncio.sleep(30)

    async def _sync_running_bots(self) -> None:
        """
        Fetch all server-mode running bots from Supabase.
        Stop bots that are no longer marked running and start new ones.
        """
        result = (
            self.supabase.table("trading_bots")
            .select("*")
            .eq("status", "running")
            .eq("mode", "server")
            .execute()
        )

        db_bots: list[dict] = result.data or []
        running_ids: set[str] = {b["id"] for b in db_bots}

        # Stop bots that are no longer in the 'running' set
        to_stop = [bid for bid in list(self._bots.keys()) if bid not in running_ids]
        for bid in to_stop:
            logger.info(f"Stopping bot {bid} (no longer running in DB)")
            await self._bots[bid].stop()
            del self._bots[bid]

        # Start newly-running bots
        for bot_data in db_bots:
            bid = bot_data["id"]
            if bid not in self._bots:
                logger.info(
                    f"Starting bot {bid} ({bot_data.get('handle', 'unknown')})"
                )
                bot = TradingBot(bid, bot_data)
                await bot.start()
                self._bots[bid] = bot
