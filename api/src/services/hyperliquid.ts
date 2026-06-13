const HL_BASE = "https://api.hyperliquid.xyz";

export interface Candle {
  t: number;
  T: number;
  s: string;
  i: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  n: number;
}

export interface Position {
  coin: string;
  szi: string;
  entryPx: string;
  positionValue: string;
  unrealizedPnl: string;
  returnOnEquity: string;
  liquidationPx: string | null;
}

export interface AccountState {
  marginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalRawUsd: string;
  };
  assetPositions: Array<{ position: Position; type: string }>;
}

const INTERVAL_MS: Record<string, number> = {
  "1m": 60_000,
  "3m": 180_000,
  "5m": 300_000,
  "15m": 900_000,
  "30m": 1_800_000,
  "1h": 3_600_000,
  "2h": 7_200_000,
  "4h": 14_400_000,
  "8h": 28_800_000,
  "12h": 43_200_000,
  "1d": 86_400_000,
  "3d": 259_200_000,
  "1w": 604_800_000,
};

async function hlPost<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${HL_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Hyperliquid API error ${res.status}: ${await res.text()}`);
  }

  return res.json() as Promise<T>;
}

export async function getCandles(
  coin: string,
  interval: string,
  lookback: number
): Promise<Candle[]> {
  const intervalMs = INTERVAL_MS[interval] ?? 1_800_000;
  const endTime = Date.now();
  const startTime = endTime - intervalMs * lookback;

  const raw = await hlPost<Array<[number, number, string, string, string, string, string, string, string]>>(
    "/info",
    {
      type: "candleSnapshot",
      req: { coin, interval, startTime, endTime },
    }
  );

  return raw.map((c) => ({
    t: c[0],
    T: c[1],
    s: coin,
    i: interval,
    o: parseFloat(c[2]),
    h: parseFloat(c[3]),
    l: parseFloat(c[4]),
    c: parseFloat(c[5]),
    v: parseFloat(c[6]),
    n: parseInt(c[7], 10),
  }));
}

export async function getAllMids(): Promise<Record<string, string>> {
  return hlPost<Record<string, string>>("/info", { type: "allMids" });
}

export async function getPrice(coin: string): Promise<number> {
  const mids = await getAllMids();
  const price = mids[coin];
  if (!price) throw new Error(`No price found for ${coin}`);
  return parseFloat(price);
}

export async function getAccountState(walletAddress: string): Promise<AccountState> {
  return hlPost<AccountState>("/info", {
    type: "clearinghouseState",
    user: walletAddress,
  });
}

export async function getAvailableCoins(): Promise<string[]> {
  const meta = await hlPost<{ universe: Array<{ name: string }> }>("/info", {
    type: "meta",
  });
  return meta.universe.map((asset) => asset.name);
}
