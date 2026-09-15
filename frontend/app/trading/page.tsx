"use client";

import { useEffect, useState } from "react";
import {
  getCandles,
  getInstruments,
  getOrderBook,
  getTrades,
  getTrader,
  type Candle,
  type Instrument,
  type OrderBook,
  type Trade,
} from "@/lib/api";
import { getTraderId } from "@/lib/trader";
import { useWebSocket } from "@/lib/useWebSocket";
import { AiInsightCard } from "@/components/trading/AiInsightCard";
import { CandleChart } from "@/components/trading/CandleChart";
import { LiveTradeTape } from "@/components/trading/LiveTradeTape";
import { MyOrdersPanel } from "@/components/trading/MyOrdersPanel";
import { OrderBookPanel } from "@/components/trading/OrderBookPanel";
import { OrderTicket } from "@/components/trading/OrderTicket";

export default function TradingTerminalPage() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [symbol, setSymbol] = useState("BBCA");
  const [symbolMenuOpen, setSymbolMenuOpen] = useState(false);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [cashBalance, setCashBalance] = useState<number | null>(null);
  const [positions, setPositions] = useState<Record<string, number>>({});
  const [refreshKey, setRefreshKey] = useState(0);

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

  useEffect(() => {
    const traderId = getTraderId();
    let cancelled = false;
    getTrader(traderId).then((t) => {
      if (cancelled) return;
      setCashBalance(t.cash_balance);
      setPositions(t.positions);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

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
  const position = positions[symbol] ?? 0;

  function handleOrderSubmitted() {
    setRefreshKey((k) => k + 1);
    getOrderBook(symbol).then(setOrderBook).catch(() => {});
  }

  return (
    <div className="flex w-full flex-col gap-space-xs">
      <div className="flex flex-wrap items-center justify-between gap-space-md bg-onyx-surface-lowest p-space-sm shadow-sm">
        <div className="flex flex-wrap items-center gap-space-md">
          <div className="relative">
            <button
              type="button"
              onClick={() => setSymbolMenuOpen((v) => !v)}
              className="flex items-center gap-space-xs bg-onyx-surface-container px-space-md py-space-xs text-onyx-on-surface hover:bg-onyx-surface-high"
            >
              <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-onyx-primary">{symbol}</span>
              <span className="font-label-sm text-label-sm bg-onyx-surface-bright px-space-xs py-0.5 font-semibold text-onyx-on-surface">
                IDX:EQUITY
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
          <div className="flex flex-col">
            <span className="font-body-md text-body-md font-semibold leading-tight text-onyx-on-surface">{current?.name ?? "—"}</span>
            <span className="font-label-sm text-label-sm text-onyx-outline">Papan Utama · Simulasi TradeSim</span>
          </div>
          <div className="hidden h-6 w-px bg-onyx-surface-bright md:block" />
          <div className="flex items-baseline gap-space-sm">
            <span className="font-headline-lg text-headline-lg font-data-lg font-bold text-onyx-primary">
              Rp {lastPrice.toLocaleString("id-ID")}
            </span>
            <span
              className={`font-data-md text-data-md px-1.5 py-0.5 font-semibold ${
                (current?.change_pct ?? 0) >= 0 ? "bg-onyx-primary/10 text-onyx-primary" : "bg-onyx-secondary-container/20 text-onyx-secondary"
              }`}
            >
              {current ? `${current.change_pct >= 0 ? "+" : ""}${current.change_pct.toFixed(2)}%` : "—"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-space-xs bg-onyx-surface-container px-space-sm py-1">
            <span className={`h-2 w-2 ${wsConnected ? "animate-pulse bg-onyx-primary" : "bg-onyx-secondary"}`} />
            <span className="font-label-sm text-label-sm uppercase text-onyx-primary">{wsConnected ? "Live" : "Terputus"}</span>
          </div>
          <div className="flex items-center gap-space-xs bg-onyx-surface-container px-space-sm py-1">
            <span className="font-label-sm text-label-sm uppercase text-onyx-outline">Engine:</span>
            <span className="font-data-sm text-data-sm text-onyx-tertiary">Price-Time Priority</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-space-xs xl:grid-cols-12">
        <div className="flex flex-col gap-space-xs xl:col-span-8">
          <div className="flex flex-col gap-space-sm bg-onyx-surface-lowest p-space-sm shadow-sm">
            <CandleChart candles={candles} />
          </div>
          <div className="bg-onyx-surface-lowest p-space-sm shadow-sm">
            <AiInsightCard symbol={symbol} />
          </div>
        </div>

        <div className="flex flex-col gap-space-xs xl:col-span-4">
          <div className="bg-onyx-surface-lowest p-space-sm shadow-sm">
            <OrderBookPanel book={orderBook} onPickPrice={() => {}} />
          </div>
          <div className="bg-onyx-surface-lowest p-space-sm shadow-sm">
            <OrderTicket symbol={symbol} lastPrice={lastPrice} cashBalance={cashBalance} position={position} onSubmitted={handleOrderSubmitted} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-space-xs xl:grid-cols-12">
        <div className="bg-onyx-surface-lowest p-space-sm shadow-sm xl:col-span-8">
          <MyOrdersPanel instruments={instruments} refreshKey={refreshKey} />
        </div>
        <div className="bg-onyx-surface-lowest p-space-sm shadow-sm xl:col-span-4">
          <LiveTradeTape trades={trades} connected={wsConnected} />
        </div>
      </div>
    </div>
  );
}
