"""
Fetches 5 years of daily OHLC data for the top 10 cryptocurrencies
(by CoinMarketCap ranking) via CoinGecko's free public API.

Top 10 CMC ranking (June 2026):
  BTC, ETH, USDT, BNB, SOL, XRP, DOGE, ADA, TRX, AVAX
"""

import csv
import json
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone

# CoinMarketCap top-10 tickers → CoinGecko IDs
TOP10 = [
    ('BTC',  'bitcoin'),
    ('ETH',  'ethereum'),
    ('USDT', 'tether'),
    ('BNB',  'binancecoin'),
    ('SOL',  'solana'),
    ('XRP',  'ripple'),
    ('DOGE', 'dogecoin'),
    ('ADA',  'cardano'),
    ('TRX',  'tron'),
    ('AVAX', 'avalanche-2'),
]

# 5 years back from today
DAYS = 1826   # 5 * 365 + 1 leap day


def fetch_json(url: str) -> dict | list:
    req = urllib.request.Request(
        url,
        headers={
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'application/json',
        }
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode('utf-8'))


def fetch_ohlc(coin_id: str) -> list[dict]:
    """
    CoinGecko /coins/{id}/ohlc endpoint returns up to 365 days max.
    We call it in 365-day windows to cover 5 years.
    Returns list of {Date, Open, High, Low, Close}.
    """
    base = "https://api.coingecko.com/api/v3"
    rows = {}

    # CoinGecko OHLC endpoint: days=1/7/14/30/90/180/365/max
    # 'max' gives full history; let's use that.
    url = f"{base}/coins/{coin_id}/ohlc?vs_currency=usd&days=max"
    data = fetch_json(url)
    # Returns [[timestamp_ms, open, high, low, close], ...]
    cutoff = datetime(2021, 6, 22, tzinfo=timezone.utc)
    for entry in data:
        ts_ms, o, h, l, c = entry
        dt = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc)
        if dt < cutoff:
            continue
        d = dt.strftime('%Y-%m-%d')
        rows[d] = {
            'Open':  round(o, 6),
            'High':  round(h, 6),
            'Low':   round(l, 6),
            'Close': round(c, 6),
        }
    return rows


def write_csv(filename: str, rows: dict) -> int:
    dates = sorted(rows.keys())
    with open(filename, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Date', 'Open', 'High', 'Low', 'Close'])
        for d in dates:
            r = rows[d]
            writer.writerow([d, r['Open'], r['High'], r['Low'], r['Close']])
    return len(dates)


print(f"Fetching 5-year daily OHLC for top-10 crypto (2021-06-22 → today)...\n")

for ticker, coin_id in TOP10:
    print(f"  {ticker} ({coin_id})...", end=" ", flush=True)
    try:
        rows = fetch_ohlc(coin_id)
        if not rows:
            print("ERROR: no data")
            continue
        filename = f"{ticker}_Daily_OHLC_5Years.csv"
        n = write_csv(filename, rows)
        print(f"OK — {n} rows ({min(rows.keys())} → {max(rows.keys())})")
        time.sleep(1.5)   # CoinGecko free tier: ~10-30 req/min
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.reason}")
    except Exception as e:
        print(f"ERROR: {e}")

print("\nDone.")
