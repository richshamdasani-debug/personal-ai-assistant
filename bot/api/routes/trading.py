from fastapi import APIRouter, HTTPException, Query

from bot.db.supabase import get_supabase
from bot.services.hyperliquid import HyperliquidClient

router = APIRouter()

# Shared read-only Hyperliquid client (no wallet)
_hl = HyperliquidClient()


# ---------------------------------------------------------------------------
# Current price
# ---------------------------------------------------------------------------

@router.get("/trading/price/{symbol}")
async def get_price(symbol: str) -> dict:
    """Return the current mid-market price for a symbol."""
    try:
        price = _hl.get_price(symbol.upper())
    except KeyError:
        raise HTTPException(
            status_code=404, detail=f"Symbol '{symbol}' not found on Hyperliquid"
        )
    return {"symbol": symbol.upper(), "price": price}


# ---------------------------------------------------------------------------
# OHLCV candles
# ---------------------------------------------------------------------------

@router.get("/trading/candles/{symbol}")
async def get_candles(
    symbol: str,
    interval: str = Query(default="4h", description="Candle interval, e.g. 1m 15m 1h 4h 1d"),
    lookback: int = Query(default=200, ge=1, le=1000, description="Number of candles to return"),
) -> list[dict]:
    """Return historical OHLCV candles for a symbol."""
    try:
        candles = _hl.get_candles(symbol.upper(), interval, lookback=lookback)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Hyperliquid API error: {exc}")

    return [
        {
            "t": c.t,
            "T": c.T,
            "s": c.s,
            "i": c.i,
            "o": c.o,
            "h": c.h,
            "l": c.l,
            "c": c.c,
            "v": c.v,
            "n": c.n,
        }
        for c in candles
    ]


# ---------------------------------------------------------------------------
# Available symbols
# ---------------------------------------------------------------------------

@router.get("/trading/symbols")
async def get_symbols() -> list[str]:
    """Return the list of tradeable coins available on Hyperliquid."""
    try:
        return _hl.get_available_coins()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Hyperliquid API error: {exc}")


# ---------------------------------------------------------------------------
# Leaderboard
# ---------------------------------------------------------------------------

@router.get("/leaderboard")
async def get_leaderboard(
    sort: str = Query(default="roi", description="Sort field: 'roi' | 'pnl' | 'trades'"),
) -> list[dict]:
    """
    Return the public bot leaderboard.
    Reads from the 'leaderboard' view in Supabase (created separately in the DB).
    Supported sort values: 'roi', 'pnl', 'trades'.
    """
    allowed_sorts = {"roi", "pnl", "trades"}
    if sort not in allowed_sorts:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sort '{sort}'. Allowed: {sorted(allowed_sorts)}",
        )

    supabase = get_supabase()

    sort_column_map = {
        "roi": "roi_pct",
        "pnl": "total_pnl_usd",
        "trades": "total_trades",
    }
    order_col = sort_column_map[sort]

    try:
        result = (
            supabase.table("leaderboard")
            .select("*")
            .order(order_col, desc=True)
            .limit(100)
            .execute()
        )
        return result.data or []
    except Exception as exc:
        raise HTTPException(
            status_code=502, detail=f"Failed to fetch leaderboard: {exc}"
        )
