"use client";

import { useEffect, useState } from "react";
import {
  getCandles,
  getInstruments,
  getOrderBook,
  getTrades,
  type Candle,
  type Instrument,
  type OrderBook,
  type Trade,
} from "@/lib/api";
import { useWebSocket } from "@/lib/useWebSocket";
import { CandleChart } from "@/components/trading/CandleChart";
import { DepthChart } from "@/components/trading/DepthChart";
import { LiveTradeTape } from "@/components/trading/LiveTradeTape";
import { OrderBookPanel } from "@/components/trading/OrderBookPanel";

/** Cumulative VWAP over the loaded candle window — same formula as
 * CandleChart, recomputed here for the header telemetry strip. */
function latestVwap(candles: Candle[]): number | null {
  if (candles.length === 0) return null;
  let cumPV = 0;
  let cumV = 0;
  for (const c of candles) {
    const typical = (c.high + c.low + c.close) / 3;
    cumPV += typical * c.volume;
    cumV += c.volume;
  }
  return cumV > 0 ? cumPV / cumV : candles[candles.length - 1].close;
}

export default function OrderBookDepthPage() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [symbol, setSymbol] = useState("BBCA");
  const [symbolMenuOpen, setSymbolMenuOpen] = useState(false);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    getInstruments().then(setInstruments).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getOrderBook(symbol), getCandles(symbol), getTrades(symbol)]).then(([book, c, t]) => {
      if (cancelled) return;
      setOrderBook(book);
      setCandles(c);
      setTrades([...t].sort((a, b) => (a.executed_at < b.executed_at ? 1 : -1)));
    });
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  useWebSocket(
    (msg) => {
      if (msg.type === "price_update") {
        setInstruments((prev) =>
          prev.map((i) => (i.symbol === msg.symbol ? { ...i, last_price: msg.last_price, change_pct: msg.change_pct } : i)),
        );
      }
      if (msg.symbol !== symbol) return;
      if (msg.type === "orderbook_update") {
        setOrderBook({ symbol: msg.symbol, bids: msg.bids, asks: msg.asks });
      }
      if (msg.type === "trade_executed") {
        const now = new Date().toISOString();
        setTrades((prev) => [
          { id: `${now}-${Math.random()}`, symbol: msg.symbol, buy_order_id: "", sell_order_id: "", price: msg.trade.price, quantity: msg.trade.quantity, executed_at: now },
          ...prev,
        ]);
        setCandles((prev) => {
          if (prev.length === 0) return prev;
          const next = [...prev];
          const last = { ...next[next.length - 1] };
          last.close = msg.trade.price;
          last.high = Math.max(last.high, msg.trade.price);
          last.low = Math.min(last.low, msg.trade.price);
          last.volume += msg.trade.quantity;
          next[next.length - 1] = last;
          return next;
        });
      }
    },
    setWsConnected,
  );

  const current = instruments.find((i) => i.symbol === symbol);
  const lastPrice = current?.last_price ?? 0;

  const bestBid = orderBook?.bids[0]?.price ?? null;
  const bestAsk = orderBook?.asks[0]?.price ?? null;
  const spread = bestBid !== null && bestAsk !== null ? bestAsk - bestBid : null;
  const mid = bestBid !== null && bestAsk !== null ? (bestBid + bestAsk) / 2 : null;
  const vwap = latestVwap(candles);
  const recordedVolume = trades.reduce((s, t) => s + t.quantity, 0);

  return (
    <div className="flex w-full flex-col gap-space-xs">
      <div className="flex flex-wrap items-center justify-between gap-space-md bg-onyx-surface-lowest p-space-sm shadow-sm">
        <div className="flex flex-wrap items-center gap-space-lg">
          <div className="relative">
            <button
              type="button"
              onClick={() => setSymbolMenuOpen((v) => !v)}
              className="flex items-center gap-space-sm bg-onyx-surface-container px-space-md py-space-xs text-onyx-on-surface hover:bg-onyx-surface-high"
            >
              <span className="material-symbols-outlined text-[18px] text-onyx-primary">candlestick_chart</span>
              <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-onyx-on-surface">{symbol}</span>
              <span className="font-label-sm text-label-sm bg-onyx-surface-highest px-space-xs py-0.5 uppercase text-onyx-on-surface-variant">
                {current?.name ?? "—"}
              </span>
              <span className="material-symbols-outlined text-[16px] text-onyx-outline">expand_more</span>
            </button>
            {symbolMenuOpen && (
              <div className="absolute left-0 z-50 mt-1 w-64 bg-onyx-surface-highest py-1 shadow-xl">
                <div className="px-space-md py-1 font-label-sm text-label-sm uppercase text-onyx-outline">Pilih Saham</div>
                {instruments.map((i) => (
                  <button
                    key={i.symbol}
                    type="button"
                    onClick={() => {
                      setSymbol(i.symbol);
                      setSymbolMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-space-md py-space-xs text-left font-data-sm text-data-sm text-onyx-on-surface hover:bg-onyx-surface"
                  >
                    <span>
                      {i.symbol} — {i.name}
                    </span>
                    <span className={i.change_pct >= 0 ? "font-semibold text-onyx-primary" : "font-semibold text-onyx-secondary"}>
                      {i.last_price.toLocaleString("id-ID")}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-baseline gap-space-sm font-data-md text-data-md">
            <span className="text-headline-md font-bold text-onyx-primary">Rp {lastPrice.toLocaleString("id-ID")}</span>
            <span
              className={`font-label-md text-label-md px-space-xs py-0.5 ${
                (current?.change_pct ?? 0) >= 0 ? "bg-onyx-primary/10 text-onyx-primary" : "bg-onyx-secondary-container/20 text-onyx-secondary"
              }`}
            >
              {current ? `${current.change_pct >= 0 ? "+" : ""}${current.change_pct.toFixed(2)}%` : "—"}
            </span>
          </div>

          <div className="hidden h-6 w-px bg-onyx-surface-highest sm:block" />

          <div className="hidden items-center gap-space-lg font-data-sm text-data-sm lg:flex">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-onyx-outline">VWAP</span>
              <span className="font-semibold text-onyx-on-surface">{vwap !== null ? vwap.toLocaleString("id-ID", { maximumFractionDigits: 0 }) : "—"}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-onyx-outline">MID-POINT</span>
              <span className="font-semibold text-onyx-tertiary">{mid !== null ? mid.toLocaleString("id-ID", { maximumFractionDigits: 1 }) : "—"}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-onyx-outline">BID/ASK SPREAD</span>
              <span className="font-semibold text-onyx-tertiary-container">
                {spread !== null ? `Rp ${spread.toLocaleString("id-ID")}` : "—"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-onyx-outline">VOLUME TERCATAT</span>
              <span className="font-semibold text-onyx-on-surface">{recordedVolume.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-space-xs bg-onyx-surface-container px-space-sm py-1">
            <span className="font-label-sm text-label-sm px-space-xs text-onyx-primary">L2 AGGREGATED</span>
          </div>
          <div className="flex items-center gap-space-xs bg-onyx-surface-container px-space-sm py-1">
            <span className={`h-2 w-2 ${wsConnected ? "animate-pulse bg-onyx-primary" : "bg-onyx-secondary"}`} />
            <span className="font-label-sm text-label-sm uppercase text-onyx-primary">{wsConnected ? "Live" : "Terputus"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-space-xs xl:grid-cols-12">
        <div className="flex flex-col gap-space-xs bg-onyx-surface-lowest p-space-md xl:col-span-5">
          <div className="flex items-center gap-space-sm pb-space-xs">
            <span className="material-symbols-outlined text-[18px] text-onyx-primary">equalizer</span>
            <span className="font-headline-sm text-headline-sm font-semibold uppercase tracking-tight text-onyx-on-surface">
              Papan Order (Depth of Market)
            </span>
            <span className="font-label-sm text-label-sm bg-onyx-surface-highest px-space-xs font-bold text-onyx-primary">
              15-TIER L2
            </span>
          </div>
          <OrderBookPanel book={orderBook} />
        </div>

        <div className="flex flex-col gap-space-xs xl:col-span-7">
          <div className="bg-onyx-surface-lowest p-space-md shadow-sm">
            <DepthChart book={orderBook} />
          </div>
          <div className="grid grid-cols-1 gap-space-xs md:grid-cols-2">
            <div className="bg-onyx-surface-lowest p-space-md shadow-sm">
              <CandleChart candles={candles} height={160} />
            </div>
            <div className="bg-onyx-surface-lowest p-space-md shadow-sm">
              <LiveTradeTape trades={trades} connected={wsConnected} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
