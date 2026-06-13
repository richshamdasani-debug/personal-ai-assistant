export interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  t: number;
}

export interface TimeframeAnalysis {
  zscore: number;
  slope: number;
  chop: number;
  sma20: number;
  priceVsSMAPct: number;
  trend: "up" | "down" | "neutral";
  momentum: "strong" | "moderate" | "weak";
  currentPrice: number;
  priceChange1h: number;
}

export function sma(values: number[], period: number): number {
  if (values.length < period) return values[values.length - 1] ?? 0;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

export function zScore(closes: number[], period: number): number {
  if (closes.length < period) return 0;
  const slice = closes.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
  const std = Math.sqrt(variance);
  if (std === 0) return 0;
  return (closes[closes.length - 1] - mean) / std;
}

export function linearRegressionSlope(closes: number[], period: number): number {
  if (closes.length < period) return 0;
  const slice = closes.slice(-period);
  const n = slice.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += slice[i];
    sumXY += i * slice[i];
    sumX2 += i * i;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return 0;

  const rawSlope = (n * sumXY - sumX * sumY) / denominator;
  const mean = sumY / n;
  if (mean === 0) return 0;

  return (rawSlope / mean) * 100;
}

export function choppinessIndex(candles: Candle[], period: number): number {
  if (candles.length < period) return 50;
  const slice = candles.slice(-period);

  const sumAtr = slice.reduce((acc, c) => acc + Math.abs(c.h - c.l), 0);
  const highestHigh = Math.max(...slice.map((c) => c.h));
  const lowestLow = Math.min(...slice.map((c) => c.l));
  const range = highestHigh - lowestLow;

  if (range === 0) return 100;

  return (100 * Math.log10(sumAtr / range)) / Math.log10(period);
}

export function analyzeTimeframe(candles: Candle[], period = 20): TimeframeAnalysis {
  const closes = candles.map((c) => c.c);
  const currentPrice = closes[closes.length - 1];

  const zscore = zScore(closes, period);
  const slope = linearRegressionSlope(closes, period);
  const chop = choppinessIndex(candles, Math.min(period, candles.length));
  const sma20 = sma(closes, period);
  const priceVsSMAPct = sma20 !== 0 ? ((currentPrice - sma20) / sma20) * 100 : 0;

  const lookback1h = Math.min(2, candles.length - 1);
  const priceChange1h =
    candles.length > lookback1h
      ? ((currentPrice - candles[candles.length - 1 - lookback1h].c) /
          candles[candles.length - 1 - lookback1h].c) *
        100
      : 0;

  let trend: "up" | "down" | "neutral";
  if (slope > 0.1 && priceVsSMAPct > 0) {
    trend = "up";
  } else if (slope < -0.1 && priceVsSMAPct < 0) {
    trend = "down";
  } else {
    trend = "neutral";
  }

  let momentum: "strong" | "moderate" | "weak";
  const absZScore = Math.abs(zscore);
  if (absZScore > 2) {
    momentum = "strong";
  } else if (absZScore > 1) {
    momentum = "moderate";
  } else {
    momentum = "weak";
  }

  return {
    zscore,
    slope,
    chop,
    sma20,
    priceVsSMAPct,
    trend,
    momentum,
    currentPrice,
    priceChange1h,
  };
}
