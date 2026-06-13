import numpy as np
from dataclasses import dataclass
from typing import Optional


@dataclass
class TimeframeAnalysis:
    timeframe: str
    current_price: float
    zscore: float           # how many std devs from mean
    slope: float            # normalized linear reg slope (% of mean)
    chop: float             # choppiness index 0-100 (100=choppy, 0=trending)
    sma20: float
    price_vs_sma_pct: float  # % above/below 20SMA
    trend: str              # "up" | "down" | "neutral"
    momentum: str           # "strong" | "moderate" | "weak"
    price_change_pct: float  # % change over period


def zscore(closes: np.ndarray, period: int = 20) -> float:
    """Return z-score of current price relative to last `period` closes."""
    if len(closes) < period:
        period = len(closes)
    window = closes[-period:]
    mean = float(np.mean(window))
    std = float(np.std(window, ddof=0))
    if std == 0:
        return 0.0
    return float((closes[-1] - mean) / std)


def linear_regression_slope(closes: np.ndarray, period: int = 20) -> float:
    """
    Least-squares regression slope over the last `period` values,
    normalised as a percentage of the mean price per bar.
    """
    if len(closes) < period:
        period = len(closes)
    window = closes[-period:]
    x = np.arange(period, dtype=float)
    # Least-squares: slope = (n*sum(xy) - sum(x)*sum(y)) / (n*sum(x^2) - sum(x)^2)
    n = float(period)
    sum_x = np.sum(x)
    sum_y = np.sum(window)
    sum_xy = np.dot(x, window)
    sum_x2 = np.dot(x, x)
    denom = n * sum_x2 - sum_x ** 2
    if denom == 0:
        return 0.0
    slope = (n * sum_xy - sum_x * sum_y) / denom
    mean_price = float(np.mean(window))
    if mean_price == 0:
        return 0.0
    return float(slope / mean_price * 100)


def choppiness_index(
    highs: np.ndarray,
    lows: np.ndarray,
    closes: np.ndarray,
    period: int = 14,
) -> float:
    """
    Choppiness index over the last `period` candles.
    Range: 0 (strongly trending) to 100 (choppy/consolidating).
    Formula: 100 * log10(sum_atr / (highest_high - lowest_low)) / log10(period)
    where ATR(1) for each candle = abs(high - low).
    """
    if len(highs) < period:
        period = len(highs)
    h = highs[-period:]
    lo = lows[-period:]

    # ATR(1) for each candle — simple high-low range
    atr1 = np.abs(h - lo)
    sum_atr = float(np.sum(atr1))

    highest_high = float(np.max(h))
    lowest_low = float(np.min(lo))
    price_range = highest_high - lowest_low

    if price_range <= 0 or sum_atr <= 0:
        return 50.0  # neutral / undefined

    log_period = np.log10(period)
    if log_period == 0:
        return 50.0

    chop = 100.0 * np.log10(sum_atr / price_range) / log_period
    # Clamp to [0, 100]
    return float(np.clip(chop, 0.0, 100.0))


def sma(values: np.ndarray, period: int) -> float:
    """Simple moving average of the last `period` values."""
    if len(values) < period:
        period = len(values)
    return float(np.mean(values[-period:]))


def analyze_timeframe(candles: list[dict], timeframe: str) -> TimeframeAnalysis:
    """
    Compute all technical indicators for a set of candles.

    Each candle dict must have keys: o, h, l, c, v.
    """
    if not candles:
        raise ValueError("candles list is empty")

    opens = np.array([float(c["o"]) for c in candles], dtype=float)
    highs = np.array([float(c["h"]) for c in candles], dtype=float)
    lows = np.array([float(c["l"]) for c in candles], dtype=float)
    closes = np.array([float(c["c"]) for c in candles], dtype=float)

    current_price = float(closes[-1])

    # Z-score (20-period)
    z = zscore(closes, period=20)

    # Linear regression slope (20-period, normalised %)
    slope = linear_regression_slope(closes, period=20)

    # Choppiness index (14-period)
    chop = choppiness_index(highs, lows, closes, period=14)

    # 20-period SMA
    sma20 = sma(closes, period=20)

    # Price vs SMA %
    price_vs_sma_pct = ((current_price - sma20) / sma20 * 100) if sma20 != 0 else 0.0

    # Trend determination based on slope
    if slope > 0.1:
        trend = "up"
    elif slope < -0.1:
        trend = "down"
    else:
        trend = "neutral"

    # Momentum determination based on z-score magnitude
    abs_z = abs(z)
    if abs_z > 2.0:
        momentum = "strong"
    elif abs_z > 1.0:
        momentum = "moderate"
    else:
        momentum = "weak"

    # Price change % over last 20 bars (or available bars)
    lookback = min(20, len(closes) - 1)
    if lookback > 0 and closes[-lookback - 1] != 0:
        price_change_pct = (closes[-1] - closes[-lookback - 1]) / closes[-lookback - 1] * 100
    else:
        price_change_pct = 0.0

    return TimeframeAnalysis(
        timeframe=timeframe,
        current_price=current_price,
        zscore=z,
        slope=slope,
        chop=chop,
        sma20=sma20,
        price_vs_sma_pct=price_vs_sma_pct,
        trend=trend,
        momentum=momentum,
        price_change_pct=price_change_pct,
    )
