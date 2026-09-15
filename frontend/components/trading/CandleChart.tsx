"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "@/lib/api";

type CandleChartProps = {
  candles: Candle[];
  height?: number;
};

const SMA_PERIOD = 20;
const UP_COLOR = "#00ff66";
const DOWN_COLOR = "#ffb2b7";

function sma(values: number[], period: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += values[j];
    return sum / period;
  });
}

/** Cumulative VWAP over the loaded window — typical price (H+L+C)/3 weighted by volume. */
function vwap(candles: Candle[]): number[] {
  let cumPV = 0;
  let cumV = 0;
  return candles.map((c) => {
    const typical = (c.high + c.low + c.close) / 3;
    cumPV += typical * c.volume;
    cumV += c.volume;
    return cumV > 0 ? cumPV / cumV : typical;
  });
}

/** Real TradingView Lightweight Charts candlestick + volume + SMA20/VWAP
 * overlay, driven entirely by backend candle data (GET /candles/{symbol} +
 * live WS ticks the parent page folds into the last bar). Pan/zoom/crosshair
 * are the library's native behavior — nothing custom to wire up. On a
 * same-dataset update (only the last bar changed) this uses `series.update()`
 * instead of `setData()` so the user's current zoom/pan/scroll position is
 * never reset by a live tick — only a real dataset change (new symbol, fresh
 * history load) triggers a full reload + `fitContent()`. */
export function CandleChart({ candles, height = 280 }: CandleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const smaSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const vwapSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const datasetKeyRef = useRef<{ firstTime: number; length: number } | null>(null);
  const lastBarRef = useRef<{ high: number; low: number; close: number; volume: number } | null>(null);
  const tickRafRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: "#bbcabf",
        fontFamily: "var(--font-jetbrains-mono)",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "rgba(60,74,66,0.25)" },
        horzLines: { color: "rgba(60,74,66,0.25)" },
      },
      rightPriceScale: { borderColor: "#3c4a42" },
      timeScale: { borderColor: "#3c4a42", timeVisible: false },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#86948a", labelBackgroundColor: "#272a31", style: LineStyle.Dashed },
        horzLine: { color: "#86948a", labelBackgroundColor: "#272a31", style: LineStyle.Dashed },
      },
      handleScroll: true,
      handleScale: true,
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: UP_COLOR,
      downColor: DOWN_COLOR,
      borderUpColor: UP_COLOR,
      borderDownColor: DOWN_COLOR,
      wickUpColor: UP_COLOR,
      wickDownColor: DOWN_COLOR,
      priceScaleId: "right",
    });
    candleSeries.priceScale().applyOptions({ scaleMargins: { top: 0.06, bottom: 0.28 } });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
      color: "rgba(78,222,163,0.5)",
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    const smaSeries = chart.addLineSeries({
      color: "#4edea3",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    const vwapSeries = chart.addLineSeries({
      color: "#ffb95f",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    smaSeriesRef.current = smaSeries;
    vwapSeriesRef.current = vwapSeries;
    datasetKeyRef.current = null;

    return () => {
      if (tickRafRef.current !== null) cancelAnimationFrame(tickRafRef.current);
      chart.remove();
      chartRef.current = null;
    };
    // Chart instance is created once per mount; data is pushed in the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
    const smaSeries = smaSeriesRef.current;
    const vwapSeries = vwapSeriesRef.current;
    if (!chart || !candleSeries || !volumeSeries || !smaSeries || !vwapSeries) return;
    if (candles.length === 0) return;

    const closes = candles.map((c) => c.close);
    const smaValues = sma(closes, SMA_PERIOD);
    const vwapValues = vwap(candles);

    const prev = datasetKeyRef.current;
    const isIncremental = prev !== null && prev.length === candles.length && prev.firstTime === candles[0].time;

    if (isIncremental) {
      const last = candles[candles.length - 1];
      const lastTime = last.time as UTCTimestamp;
      const lastSma = smaValues[smaValues.length - 1];
      const lastVwap = vwapValues[vwapValues.length - 1];

      // Tween the live bar from its previously-drawn shape to the new tick
      // over a short window instead of snapping — so a real trade visibly
      // "grows" the candle/volume bar the same way TradingView's live tick
      // animation reads, rather than looking like a static redraw.
      const from = lastBarRef.current ?? { high: last.high, low: last.low, close: last.close, volume: last.volume };
      const to = { high: last.high, low: last.low, close: last.close, volume: last.volume };
      if (tickRafRef.current !== null) cancelAnimationFrame(tickRafRef.current);
      const start = performance.now();
      const TWEEN_MS = 260;
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / TWEEN_MS);
        const eased = 1 - Math.pow(1 - t, 2);
        const high = from.high + (to.high - from.high) * eased;
        const low = from.low + (to.low - from.low) * eased;
        const close = from.close + (to.close - from.close) * eased;
        const volume = from.volume + (to.volume - from.volume) * eased;
        candleSeries.update({ time: lastTime, open: last.open, high, low, close });
        volumeSeries.update({ time: lastTime, value: volume, color: close >= last.open ? "rgba(0,255,102,0.5)" : "rgba(255,178,183,0.5)" });
        if (t < 1) {
          tickRafRef.current = requestAnimationFrame(step);
        } else {
          lastBarRef.current = to;
          tickRafRef.current = null;
        }
      };
      tickRafRef.current = requestAnimationFrame(step);

      if (lastSma !== null) smaSeries.update({ time: lastTime, value: lastSma });
      vwapSeries.update({ time: lastTime, value: lastVwap });
    } else {
      candleSeries.setData(
        candles.map((c) => ({ time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close })),
      );
      volumeSeries.setData(
        candles.map((c) => ({
          time: c.time as UTCTimestamp,
          value: c.volume,
          color: c.close >= c.open ? "rgba(0,255,102,0.5)" : "rgba(255,178,183,0.5)",
        })),
      );
      smaSeries.setData(
        candles
          .map((c, i) => ({ time: c.time as UTCTimestamp, value: smaValues[i] }))
          .filter((p): p is { time: UTCTimestamp; value: number } => p.value !== null),
      );
      vwapSeries.setData(candles.map((c, i) => ({ time: c.time as UTCTimestamp, value: vwapValues[i] })));
      chart.timeScale().fitContent();

      const lastCandle = candles[candles.length - 1];
      lastBarRef.current = { high: lastCandle.high, low: lastCandle.low, close: lastCandle.close, volume: lastCandle.volume };
    }

    datasetKeyRef.current = { firstTime: candles[0].time, length: candles.length };
  }, [candles]);

  const last = candles[candles.length - 1];
  const high = candles.length > 0 ? Math.max(...candles.map((c) => c.high)) : null;
  const low = candles.length > 0 ? Math.min(...candles.map((c) => c.low)) : null;
  const closes = candles.map((c) => c.close);
  const lastSma = candles.length >= SMA_PERIOD ? sma(closes, SMA_PERIOD).at(-1) : null;
  const lastVwap = candles.length > 0 ? vwap(candles).at(-1) : null;

  return (
    <div className="flex w-full flex-col gap-space-xs">
      <div className="flex flex-wrap items-center gap-space-md font-data-sm text-data-sm">
        <span className="flex items-center gap-1 font-semibold text-onyx-on-surface-variant">
          <span className="h-1.5 w-1.5 bg-onyx-primary" /> SMA {SMA_PERIOD}: {lastSma != null ? lastSma.toFixed(0) : "—"}
        </span>
        <span className="flex items-center gap-1 font-semibold text-onyx-on-surface-variant">
          <span className="h-1.5 w-1.5 bg-onyx-tertiary" /> VWAP: {lastVwap != null ? lastVwap.toFixed(0) : "—"}
        </span>
      </div>

      {last && (
        <div className="flex justify-between font-data-sm text-data-sm text-onyx-outline">
          <div className="flex gap-space-md">
            <span>
              O: <strong className="text-onyx-on-surface">{last.open.toLocaleString("id-ID")}</strong>
            </span>
            <span>
              H: <strong className="text-onyx-neon">{high?.toLocaleString("id-ID")}</strong>
            </span>
            <span>
              L: <strong className="text-onyx-secondary">{low?.toLocaleString("id-ID")}</strong>
            </span>
            <span>
              C: <strong className="text-onyx-neon">{last.close.toLocaleString("id-ID")}</strong>
            </span>
          </div>
          <span className="font-label-sm text-label-sm">PRICE / IDR</span>
        </div>
      )}

      <div className="relative" style={{ height, width: "100%" }}>
        {/* Always mounted (even before data arrives) — the chart is created once on
            mount via a ref to this exact node; conditionally rendering it would
            leave the chart-creation effect holding a stale null ref forever. */}
        <div ref={containerRef} style={{ height, width: "100%" }} />
        {candles.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-onyx-surface text-body-md text-onyx-outline">
            Menunggu data candle…
          </div>
        )}
      </div>
    </div>
  );
}
