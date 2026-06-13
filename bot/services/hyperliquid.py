import time
from dataclasses import dataclass
from typing import Optional

from hyperliquid.info import Info
from hyperliquid.exchange import Exchange
from hyperliquid import constants
from eth_account import Account


# Interval string to milliseconds mapping
INTERVAL_TO_MS: dict[str, int] = {
    "1m": 60_000,
    "5m": 300_000,
    "15m": 900_000,
    "30m": 1_800_000,
    "1h": 3_600_000,
    "4h": 14_400_000,
    "1d": 86_400_000,
    "1w": 604_800_000,
}


@dataclass
class Candle:
    t: int      # open time ms
    T: int      # close time ms
    s: str      # symbol
    i: str      # interval
    o: float    # open
    h: float    # high
    l: float    # low
    c: float    # close
    v: float    # volume
    n: int      # num trades


@dataclass
class Position:
    coin: str
    size: float           # signed (negative = short)
    entry_price: float
    unrealized_pnl: float
    position_value: float
    liquidation_px: Optional[float]


@dataclass
class AccountState:
    account_value: float
    total_margin_used: float
    positions: list[Position]


class HyperliquidClient:
    def __init__(
        self,
        wallet_address: str | None = None,
        private_key: str | None = None,
    ) -> None:
        self.info = Info(constants.MAINNET_API_URL, skip_ws=True)
        self.exchange: Exchange | None = None
        self.wallet_address: str | None = wallet_address

        if private_key:
            account = Account.from_key(private_key)
            self.exchange = Exchange(account, constants.MAINNET_API_URL)
            # Derive wallet address from private key if not explicitly provided
            if not self.wallet_address:
                self.wallet_address = account.address

    # ------------------------------------------------------------------
    # Market data (no auth required)
    # ------------------------------------------------------------------

    def get_candles(self, coin: str, interval: str, lookback: int = 200) -> list[Candle]:
        """Fetch historical candles for a coin/interval pair."""
        interval_ms = INTERVAL_TO_MS.get(interval)
        if interval_ms is None:
            raise ValueError(
                f"Unknown interval '{interval}'. Supported: {list(INTERVAL_TO_MS.keys())}"
            )

        end_time_ms = int(time.time() * 1000)
        start_time_ms = end_time_ms - interval_ms * lookback

        raw: list[dict] = self.info.candles_snapshot(coin, interval, start_time_ms, end_time_ms)

        candles: list[Candle] = []
        for c in raw:
            candles.append(
                Candle(
                    t=int(c["t"]),
                    T=int(c["T"]),
                    s=str(c.get("s", coin)),
                    i=str(c.get("i", interval)),
                    o=float(c["o"]),
                    h=float(c["h"]),
                    l=float(c["l"]),
                    c=float(c["c"]),
                    v=float(c["v"]),
                    n=int(c["n"]),
                )
            )
        return candles

    def get_price(self, coin: str) -> float:
        """Return the current mid price for a coin."""
        mids: dict[str, str] = self.info.all_mids()
        if coin not in mids:
            raise KeyError(f"Coin '{coin}' not found in market data.")
        return float(mids[coin])

    def get_all_prices(self) -> dict[str, float]:
        """Return all mid prices as a dict[coin, price]."""
        mids: dict[str, str] = self.info.all_mids()
        return {k: float(v) for k, v in mids.items()}

    def get_account_state(self, wallet_address: str) -> AccountState:
        """Fetch account state (margin summary + open positions) for a wallet."""
        raw = self.info.user_state(wallet_address)

        margin_summary = raw.get("marginSummary", {})
        account_value = float(margin_summary.get("accountValue", 0))
        total_margin_used = float(margin_summary.get("totalMarginUsed", 0))

        positions: list[Position] = []
        for asset_pos in raw.get("assetPositions", []):
            pos = asset_pos.get("position", {})
            coin = str(pos.get("coin", ""))
            size_val = pos.get("szi", "0")
            size = float(size_val) if size_val else 0.0
            entry_px = float(pos.get("entryPx", 0) or 0)
            unrealized_pnl = float(pos.get("unrealizedPnl", 0) or 0)
            position_value = float(pos.get("positionValue", 0) or 0)
            liq_px_raw = pos.get("liquidationPx")
            liquidation_px = float(liq_px_raw) if liq_px_raw is not None else None

            positions.append(
                Position(
                    coin=coin,
                    size=size,
                    entry_price=entry_px,
                    unrealized_pnl=unrealized_pnl,
                    position_value=position_value,
                    liquidation_px=liquidation_px,
                )
            )

        return AccountState(
            account_value=account_value,
            total_margin_used=total_margin_used,
            positions=positions,
        )

    def get_position(self, coin: str, wallet_address: str) -> Position | None:
        """Return the open position for a specific coin, or None if flat."""
        account = self.get_account_state(wallet_address)
        for pos in account.positions:
            if pos.coin == coin and pos.size != 0:
                return pos
        return None

    def get_available_coins(self) -> list[str]:
        """Return the list of tradeable coins from the HL universe."""
        meta = self.info.meta()
        universe: list[dict] = meta.get("universe", [])
        return [asset["name"] for asset in universe]

    # ------------------------------------------------------------------
    # Order management (requires private_key / exchange)
    # ------------------------------------------------------------------

    def _require_exchange(self) -> Exchange:
        if self.exchange is None:
            raise RuntimeError(
                "Exchange not initialised. Provide a private_key to HyperliquidClient."
            )
        return self.exchange

    def place_order(
        self,
        coin: str,
        is_buy: bool,
        size: float,
        price: float,
        order_type: str = "gtc",
    ) -> dict:
        """Place a limit order. Returns the SDK response dict."""
        exchange = self._require_exchange()
        tif = order_type.upper() if order_type.lower() != "gtc" else "Gtc"
        result = exchange.order(coin, is_buy, size, price, {"limit": {"tif": tif}})
        return result  # type: ignore[return-value]

    def close_position(self, coin: str) -> dict:
        """Close an open position by placing the opposite side at market."""
        if not self.wallet_address:
            raise RuntimeError("wallet_address is required to close a position.")
        position = self.get_position(coin, self.wallet_address)
        if position is None or position.size == 0:
            return {"status": "no_position"}

        exchange = self._require_exchange()
        is_buy = position.size < 0  # if short, buy to close; if long, sell to close
        close_size = abs(position.size)
        # Use a market order via slippage price
        current_price = self.get_price(coin)
        # For market-like limit: buy above market, sell below market (small slippage)
        slippage = 0.01  # 1%
        if is_buy:
            price = current_price * (1 + slippage)
        else:
            price = current_price * (1 - slippage)

        result = exchange.order(
            coin,
            is_buy,
            close_size,
            round(price, 2),
            {"limit": {"tif": "Ioc"}},  # Immediate-or-cancel for market-like fill
        )
        return result  # type: ignore[return-value]
