"use client";

import { useEffect, useState } from "react";
import { getInstruments, getOrdersForTrader, getTrader, type Instrument, type Order } from "@/lib/api";
import { formatIDR, formatPct } from "@/lib/format";
import { getTraderId } from "@/lib/trader";
import { useWebSocket } from "@/lib/useWebSocket";

const REFRESH_MS = 5000;

export function TopBar() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [cashBalance, setCashBalance] = useState<number | null>(null);
  const [positions, setPositions] = useState<Record<string, number>>({});
  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    getInstruments().then(setInstruments).catch(() => {});
  }, []);

  useEffect(() => {
    const traderId = getTraderId();
    let cancelled = false;

    function refresh() {
      getTrader(traderId)
        .then((t) => {
          if (cancelled) return;
          setCashBalance(t.cash_balance);
          setPositions(t.positions);
        })
        .catch(() => {});
      getOrdersForTrader(traderId)
        .then((orders) => {
          if (cancelled) return;
          setOpenOrders(orders.filter((o) => o.status === "OPEN" || o.status === "PARTIALLY_FILLED"));
        })
        .catch(() => {});
    }

    refresh();
    const interval = setInterval(refresh, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useWebSocket(
    (msg) => {
      if (msg.type === "price_update") {
        setInstruments((prev) =>
          prev.map((i) => (i.symbol === msg.symbol ? { ...i, last_price: msg.last_price, change_pct: msg.change_pct } : i)),
        );
      }
    },
    setWsConnected,
  );

  const portfolioValue =
    cashBalance !== null
      ? cashBalance +
        Object.entries(positions).reduce((sum, [symbol, qty]) => {
          const price = instruments.find((i) => i.symbol === symbol)?.last_price ?? 0;
          return sum + qty * price;
        }, 0)
      : null;

  return (
    <header className="fixed left-64 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-onyx-outline-variant/40 bg-onyx-surface-lowest/95 px-space-lg backdrop-blur-md">
      <div className="flex items-center gap-space-lg overflow-x-hidden whitespace-nowrap">
        <div className="flex items-center gap-space-sm border-r border-onyx-outline-variant/30 pr-space-lg">
          <span className="font-label-sm text-label-sm uppercase text-onyx-outline">WATCHLIST</span>
          <span className={`h-1.5 w-1.5 rounded-none ${wsConnected ? "animate-ping bg-onyx-primary" : "bg-onyx-secondary"}`} />
        </div>
        <div className="flex items-center gap-space-xl font-data-sm text-data-sm">
          {instruments.slice(0, 6).map((i) => (
            <div key={i.symbol} className="flex items-baseline gap-space-xs">
              <span className="font-semibold text-onyx-on-surface">{i.symbol}</span>
              <span className="text-onyx-on-surface">{formatIDR(i.last_price)}</span>
              <span className={i.change_pct >= 0 ? "text-onyx-primary" : "text-onyx-secondary"}>
                {formatPct(i.change_pct)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-space-lg">
        <div className="flex items-center gap-space-lg border border-onyx-outline-variant/30 bg-onyx-surface-low px-space-md py-space-xs font-data-sm text-data-sm">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm uppercase text-onyx-outline">Cash Balance</span>
            <span className="font-semibold text-onyx-on-surface">
              {cashBalance !== null ? `Rp ${formatIDR(cashBalance)}` : "—"}
            </span>
          </div>
          <div className="h-6 w-px bg-onyx-outline-variant/30" />
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm uppercase text-onyx-outline">Portfolio Value</span>
            <span className="font-semibold text-onyx-on-surface">
              {portfolioValue !== null ? `Rp ${formatIDR(portfolioValue)}` : "—"}
            </span>
          </div>
          <div className="h-6 w-px bg-onyx-outline-variant/30" />
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm uppercase text-onyx-outline">Open Orders</span>
            <span className="font-semibold text-onyx-on-surface">{openOrders.length}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
