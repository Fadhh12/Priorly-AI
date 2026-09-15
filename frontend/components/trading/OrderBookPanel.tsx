"use client";

import { useEffect, useRef, useState } from "react";
import type { OrderBook } from "@/lib/api";

type OrderBookPanelProps = {
  book: OrderBook | null;
  onPickPrice?: (price: number) => void;
};

const FLASH_MS = 650;

/** Diff two `price -> quantity` snapshots and return the set of prices whose
 * quantity changed or that are newly present — used to flash exactly the
 * rows a fresh `orderbook_update` WS frame actually touched. */
function changedPrices(prev: Map<number, number>, next: Map<number, number>): Set<number> {
  const changed = new Set<number>();
  next.forEach((qty, price) => {
    if (prev.get(price) !== qty) changed.add(price);
  });
  return changed;
}

/** Level-2 depth view — real aggregated levels from GET /orderbook/{symbol}
 * (store.get_orderbook_snapshot). No per-level order count is shown because
 * the backend only returns aggregated price+quantity, not order counts. Rows
 * flash briefly (green for bids, rose for asks) whenever a WS
 * `orderbook_update` frame actually changes that price level's quantity. */
export function OrderBookPanel({ book, onPickPrice }: OrderBookPanelProps) {
  const bids = book?.bids ?? [];
  const asks = book?.asks ?? [];

  const prevBidsRef = useRef<Map<number, number>>(new Map());
  const prevAsksRef = useRef<Map<number, number>>(new Map());
  const [flashBids, setFlashBids] = useState<Set<number>>(new Set());
  const [flashAsks, setFlashAsks] = useState<Set<number>>(new Set());

  useEffect(() => {
    const nextBids = new Map(bids.map((l) => [l.price, l.quantity]));
    const nextAsks = new Map(asks.map((l) => [l.price, l.quantity]));

    const bidChanges = changedPrices(prevBidsRef.current, nextBids);
    const askChanges = changedPrices(prevAsksRef.current, nextAsks);
    prevBidsRef.current = nextBids;
    prevAsksRef.current = nextAsks;

    if (bidChanges.size === 0 && askChanges.size === 0) return;
    setFlashBids(bidChanges);
    setFlashAsks(askChanges);
    const timer = setTimeout(() => {
      setFlashBids(new Set());
      setFlashAsks(new Set());
    }, FLASH_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book]);

  const bidTotal = bids.reduce((s, l) => s + l.quantity, 0);
  const askTotal = asks.reduce((s, l) => s + l.quantity, 0);
  const grandTotal = bidTotal + askTotal || 1;
  const bidPct = Math.round((bidTotal / grandTotal) * 100);
  const askPct = 100 - bidPct;

  const bestBid = bids[0]?.price ?? null;
  const bestAsk = asks[0]?.price ?? null;
  const spread = bestBid !== null && bestAsk !== null ? bestAsk - bestBid : null;
  const mid = bestBid !== null && bestAsk !== null ? (bestBid + bestAsk) / 2 : null;

  const maxBidQty = Math.max(...bids.map((l) => l.quantity), 1);
  const maxAskQty = Math.max(...asks.map((l) => l.quantity), 1);

  return (
    <div className="flex flex-col gap-space-xs">
      <div className="flex items-center justify-between pb-1">
        <span className="font-label-sm text-label-sm font-semibold uppercase text-onyx-outline">
          Level-2 Order Book
        </span>
        <div className="flex items-center gap-space-sm font-data-sm text-data-sm">
          <span className="text-onyx-outline">
            Spread: <strong className="text-onyx-on-surface">{spread !== null ? spread.toLocaleString("id-ID") : "—"}</strong>
          </span>
          <span className="text-onyx-outline">
            Mid: <strong className="text-onyx-tertiary">{mid !== null ? mid.toLocaleString("id-ID") : "—"}</strong>
          </span>
        </div>
      </div>

      <div className="flex h-2 w-full overflow-hidden bg-onyx-surface-low">
        <div className="h-full bg-onyx-primary transition-[width] duration-500 ease-out" style={{ width: `${bidPct}%` }} title={`Bids: ${bidPct}%`} />
        <div className="h-full bg-onyx-secondary-container transition-[width] duration-500 ease-out" style={{ width: `${askPct}%` }} title={`Asks: ${askPct}%`} />
      </div>
      <div className="flex justify-between font-label-sm text-label-sm">
        <span className="font-bold text-onyx-primary">BID {bidPct}% ({bidTotal.toLocaleString("id-ID")})</span>
        <span className="font-bold text-onyx-secondary">ASK {askPct}% ({askTotal.toLocaleString("id-ID")})</span>
      </div>

      <div className="grid grid-cols-2 gap-x-1 pt-1 font-data-sm text-data-sm">
        <div className="flex flex-col">
          <div className="flex justify-between bg-onyx-surface-high px-1 py-1 font-label-sm text-label-sm text-onyx-outline">
            <span>VOL</span>
            <span>BID</span>
          </div>
          <div className="flex flex-col gap-0.5">
            {bids.length === 0 && <div className="px-1 py-2 text-center text-onyx-outline">Kosong</div>}
            {bids.map((level) => (
              <button
                key={level.price}
                onClick={() => onPickPrice?.(level.price)}
                className={`relative flex items-center justify-between bg-onyx-surface-low px-1 py-0.5 text-left hover:bg-onyx-surface-bright ${
                  flashBids.has(level.price) ? "animate-flashUp" : ""
                }`}
              >
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 bg-onyx-primary/20 transition-[width] duration-300 ease-out"
                  style={{ width: `${(level.quantity / maxBidQty) * 100}%` }}
                />
                <span className="z-10 font-semibold text-onyx-on-surface">{level.quantity.toLocaleString("id-ID")}</span>
                <span className="z-10 font-bold text-onyx-primary">{level.price.toLocaleString("id-ID")}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex justify-between bg-onyx-surface-high px-1 py-1 font-label-sm text-label-sm text-onyx-outline">
            <span>ASK</span>
            <span>VOL</span>
          </div>
          <div className="flex flex-col gap-0.5">
            {asks.length === 0 && <div className="px-1 py-2 text-center text-onyx-outline">Kosong</div>}
            {asks.map((level) => (
              <button
                key={level.price}
                onClick={() => onPickPrice?.(level.price)}
                className={`relative flex items-center justify-between bg-onyx-surface-low px-1 py-0.5 text-left hover:bg-onyx-surface-bright ${
                  flashAsks.has(level.price) ? "animate-flashDown" : ""
                }`}
              >
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 bg-onyx-secondary-container/25 transition-[width] duration-300 ease-out"
                  style={{ width: `${(level.quantity / maxAskQty) * 100}%` }}
                />
                <span className="z-10 font-bold text-onyx-secondary">{level.price.toLocaleString("id-ID")}</span>
                <span className="z-10 font-semibold text-onyx-on-surface">{level.quantity.toLocaleString("id-ID")}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
