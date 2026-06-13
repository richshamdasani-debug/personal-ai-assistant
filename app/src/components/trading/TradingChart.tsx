"use client";

import { useEffect, useRef } from "react";

interface Candle {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
}

interface TradingChartProps {
  candles: Candle[];
  symbol: string;
  interval: string;
}

export default function TradingChart({ candles, symbol, interval }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    let chart: ReturnType<typeof import("lightweight-charts")["createChart"]> | null = null;
    let resizeObserver: ResizeObserver | null = null;

    import("lightweight-charts").then(({ createChart, ColorType }) => {
      if (!chartContainerRef.current) return;

      chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: "#0f172a" },
          textColor: "#94a3b8",
        },
        grid: {
          vertLines: { color: "#1e293b" },
          horzLines: { color: "#1e293b" },
        },
        crosshair: {
          vertLine: { color: "#475569", labelBackgroundColor: "#1e293b" },
          horzLine: { color: "#475569", labelBackgroundColor: "#1e293b" },
        },
        rightPriceScale: {
          borderColor: "#1e293b",
          textColor: "#94a3b8",
        },
        timeScale: {
          borderColor: "#1e293b",
          textColor: "#94a3b8",
          timeVisible: true,
          secondsVisible: false,
        },
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const candleSeries = (chart as any).addCandlestickSeries({
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderUpColor: "#22c55e",
        borderDownColor: "#ef4444",
        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444",
      });

      if (candles.length > 0) {
        const sortedCandles = [...candles].sort((a, b) => a.time - b.time);
        candleSeries.setData(
          sortedCandles.map((c) => ({
            time: c.time as Parameters<typeof candleSeries.setData>[0][0]["time"],
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }))
        );
        chart.timeScale().fitContent();
      }

      resizeObserver = new ResizeObserver(() => {
        if (chartContainerRef.current && chart) {
          chart.resize(
            chartContainerRef.current.clientWidth,
            chartContainerRef.current.clientHeight
          );
        }
      });

      resizeObserver.observe(chartContainerRef.current);
    });

    return () => {
      resizeObserver?.disconnect();
      if (chart) {
        chart.remove();
        chart = null;
      }
    };
  }, [candles]);

  return (
    <div className="relative w-full h-full">
      {/* Symbol/interval label */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
        <span className="text-white font-bold text-sm">{symbol}/USD</span>
        <span className="text-slate-500 text-xs">{interval}</span>
      </div>
      <div ref={chartContainerRef} className="w-full h-full" />
      {candles.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-slate-500 text-sm">No chart data available</span>
        </div>
      )}
    </div>
  );
}
