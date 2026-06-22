"""
Fetches 5 years of daily OHLC data for the Magnificent 7 stocks.
Sources (both on raw.githubusercontent.com which is in the network allowlist):
  - TineyKode/stock-ai  : 2021-06-21 ~ late 2025  (per-ticker CSV)
  - timhun/daily-podcast-stk : ~Jun 2025 ~ Jun 2026 (per-ticker CSV)
"""

import csv
import io
import urllib.request
from datetime import datetime

MAG7 = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA']

# timhun uses GOOG ticker for Alphabet
TIMHUN_TICKER = {
    'GOOGL': 'GOOG',
}


def fetch_url(url: str) -> str:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode('utf-8')


def parse_tineykode(raw: str, ticker: str) -> dict:
    """
    TineyKode format:
      Price,Close,High,Low,Open,Volume
      Ticker,AAPL,AAPL,AAPL,AAPL,AAPL
      Date,,,,,
      2021-06-21,128.96,...
    Returns {date_str: {'Open':..., 'High':..., 'Low':..., 'Close':...}}
    """
    lines = raw.strip().splitlines()
    # Skip the 3 header lines
    data = {}
    for line in lines[3:]:
        if not line.strip():
            continue
        parts = line.split(',')
        if len(parts) < 5:
            continue
        date = parts[0].strip()
        try:
            close = round(float(parts[1]), 2)
            high  = round(float(parts[2]), 2)
            low   = round(float(parts[3]), 2)
            open_ = round(float(parts[4]), 2)
        except (ValueError, IndexError):
            continue
        data[date] = {'Open': open_, 'High': high, 'Low': low, 'Close': close}
    return data


def parse_timhun(raw: str, ticker: str) -> dict:
    """
    timhun format:
      date,symbol,open,high,low,close,change,volume
    Returns {date_str: {'Open':..., 'High':..., 'Low':..., 'Close':...}}
    """
    reader = csv.DictReader(io.StringIO(raw))
    data = {}
    for row in reader:
        date = row.get('date', '').strip()
        if not date:
            continue
        try:
            data[date] = {
                'Open':  round(float(row['open']),  2),
                'High':  round(float(row['high']),  2),
                'Low':   round(float(row['low']),   2),
                'Close': round(float(row['close']), 2),
            }
        except (ValueError, KeyError):
            continue
    return data


def write_csv(filename: str, rows: dict):
    dates = sorted(rows.keys())
    with open(filename, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Date', 'Open', 'High', 'Low', 'Close'])
        for d in dates:
            r = rows[d]
            writer.writerow([d, r['Open'], r['High'], r['Low'], r['Close']])
    return len(dates)


for ticker in MAG7:
    print(f"Processing {ticker}...")

    # --- Source 1: TineyKode ---
    url1 = f"https://raw.githubusercontent.com/TineyKode/stock-ai/main/data/us/{ticker.lower()}.csv"
    try:
        raw1 = fetch_url(url1)
        data1 = parse_tineykode(raw1, ticker)
        print(f"  TineyKode: {len(data1)} rows ({min(data1)} → {max(data1)})")
    except Exception as e:
        data1 = {}
        print(f"  TineyKode: FAILED — {e}")

    # --- Source 2: timhun ---
    t2 = TIMHUN_TICKER.get(ticker, ticker)
    url2 = f"https://raw.githubusercontent.com/timhun/daily-podcast-stk/main/data/market/daily_{t2}.csv"
    try:
        raw2 = fetch_url(url2)
        data2 = parse_timhun(raw2, ticker)
        print(f"  timhun:    {len(data2)} rows ({min(data2)} → {max(data2)})")
    except Exception as e:
        data2 = {}
        print(f"  timhun:    FAILED — {e}")

    # --- Merge (timhun overwrites TineyKode for overlapping dates) ---
    merged = {**data1, **data2}

    # Keep only dates within the 5-year window
    cutoff_start = '2021-06-22'
    cutoff_end   = datetime.today().strftime('%Y-%m-%d')
    merged = {d: v for d, v in merged.items() if cutoff_start <= d <= cutoff_end}

    filename = f"{ticker}_Daily_OHLC_5Years.csv"
    n = write_csv(filename, merged)
    print(f"  → {filename}: {n} rows ({min(merged)} → {max(merged)})\n")

print("All done.")
