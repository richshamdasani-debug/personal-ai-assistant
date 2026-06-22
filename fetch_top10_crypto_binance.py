"""
Fetches daily OHLC data for the top crypto (by CoinMarketCap ranking,
verified live June 2026) via Binance's public REST API - no key needed,
no 365-day cap, and genuinely daily candles (unlike CoinGecko's free tier,
which silently downgrades anything older than 30 days to 4-day candles).

Excludes USDT and USDC from the top-10 (stablecoins, pegged to $1 - there's
no trend for this strategy to catch). That leaves 8 real coins. Edit the
COINS list below to add/remove anything.

Output files: BTC_Daily_OHLC_5Years.csv, ETH_Daily_OHLC_5Years.csv, ...
Columns: Date, Open, High, Low, Close  (matches the MAG7 CSV format)

NOTE: Requires unrestricted outbound internet access to api.binance.com.
Run this locally - sandboxed/cloud dev environments often block arbitrary
external hosts (confirmed: this exact host is blocked in Claude's sandbox).

If your country/region blocks Binance access, swap BASE to
https://api.binance.us/api/v3/klines (US-compliant mirror, slightly
smaller pair list) or https://data-api.binance.vision/api/v3/klines
(historical-data mirror, also key-free).
"""

import csv
import time
import urllib.request
import urllib.error
import json
from datetime import datetime, timezone

BASE = "https://api.binance.com/api/v3/klines"

# CoinMarketCap top-10 (live, verified June 2026), minus USDT/USDC (stablecoins)
COINS = [
    ('BTC',  'BTCUSDT'),
    ('ETH',  'ETHUSDT'),
    ('BNB',  'BNBUSDT'),
    ('XRP',  'XRPUSDT'),
    ('SOL',  'SOLUSDT'),
    ('TRX',  'TRXUSDT'),
    ('HYPE', 'HYPEUSDT'),
    ('DOGE', 'DOGEUSDT'),
]

YEARS_BACK = 5
START_DATE = datetime(2021, 6, 22, tzinfo=timezone.utc)  # matches the MAG7 dataset start
END_DATE = datetime.now(timezone.utc)

MS_PER_DAY = 24 * 60 * 60 * 1000
MAX_CANDLES_PER_CALL = 1000  # Binance's per-request limit


def fetch_json(url: str):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode('utf-8'))


def fetch_daily_klines(symbol: str, start_ms: int, end_ms: int) -> list:
    """Paginates through Binance's /klines endpoint to cover the full range."""
    all_rows = []
    cursor = start_ms
    while cursor < end_ms:
        url = (
            f"{BASE}?symbol={symbol}&interval=1d"
            f"&startTime={cursor}&endTime={end_ms}&limit={MAX_CANDLES_PER_CALL}"
        )
        batch = fetch_json(url)
        if not batch:
            break
        all_rows.extend(batch)
        last_open_time = batch[-1][0]
        cursor = last_open_time + MS_PER_DAY
        if len(batch) < MAX_CANDLES_PER_CALL:
            break
        time.sleep(0.3)  # be polite; klines has a generous but non-zero rate limit
    return all_rows


def write_csv(filename: str, klines: list) -> int:
    with open(filename, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Date', 'Open', 'High', 'Low', 'Close'])
        for k in klines:
            open_time_ms = k[0]
            date_str = datetime.fromtimestamp(open_time_ms / 1000, tz=timezone.utc).strftime('%Y-%m-%d')
            o, h, l, c = k[1], k[2], k[3], k[4]
            writer.writerow([date_str, o, h, l, c])
    return len(klines)


print(f"Fetching daily OHLC for {len(COINS)} coins, {START_DATE.date()} -> {END_DATE.date()}...\n")

start_ms = int(START_DATE.timestamp() * 1000)
end_ms = int(END_DATE.timestamp() * 1000)

for ticker, symbol in COINS:
    print(f"  {ticker} ({symbol})...", end=" ", flush=True)
    try:
        klines = fetch_daily_klines(symbol, start_ms, end_ms)
        if not klines:
            print("ERROR: no data returned (symbol may not exist or has no history in this range)")
            continue
        filename = f"{ticker}_Daily_OHLC_5Years.csv"
        n = write_csv(filename, klines)
        first_date = datetime.fromtimestamp(klines[0][0] / 1000, tz=timezone.utc).date()
        last_date = datetime.fromtimestamp(klines[-1][0] / 1000, tz=timezone.utc).date()
        print(f"OK - {n} rows ({first_date} -> {last_date})")
        if (first_date - START_DATE.date()).days > 30:
            print(f"      note: {ticker} only listed/trading from {first_date} - shorter history than requested")
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='ignore')
        print(f"HTTP {e.code}: {body}")
    except Exception as e:
        print(f"ERROR: {e}")
    time.sleep(0.3)

print("\nDone.")
