"use client";

import { useEffect, useRef } from "react";
import type { Trade } from "@/lib/api";

type LiveTradeTapeProps = {
  trades: Trade[];
  connected: boolean;
};

/** Recent prints for the selected symbol — GET /trades/{symbol} seed plus
 * live `trade_executed` WS frames prepended by the parent page. No
 * buyer/seller column: Trade only carries buy_order_id/sell_order_id, and
 * there is no endpoint to resolve an arbitrary order id back to a trader. */
export function LiveTradeTape({ trades, connected }: LiveTradeTapeProps) {
  const recent = trades.slice(0, 20);
  const cutoff = Date.now() - 10_000;
  const matchedPer10s = trades.filter((t) => new Date(t.executed_at).getTime() >= cutoff).length;

  // Track which trade ids have already been rendered so only a genuinely new
  // print (from a live WS tick) plays the slide-in entrance, not the whole
  // list on every unrelated re-render.
  const seenIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    seenIdsRef.current = new Set(recent.map((t) => t.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trades]);

  return (
    <div className="flex flex-col gap-space-xs">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-space-xs">
          <span className={`h-1.5 w-1.5 ${connected ? "animate-ping bg-onyx-primary" : "bg-onyx-secondary"}`} />
          <span className="font-label-sm text-label-sm font-semibold uppercase text-onyx-outline">Live Trade Tape</span>
        </div>
        <span className="font-data-sm text-data-sm text-onyx-outline">MATCHED/10S: {matchedPer10s}</span>
      </div>
      <div className="flex justify-between bg-onyx-surface-high px-space-sm py-1 font-label-sm text-label-sm uppercase text-onyx-outline">
        <span>Time</span>
        <span>Price</span>
        <span>Vol</span>
      </div>
      <div className="flex flex-col gap-0.5 font-data-sm text-data-sm">
        {recent.length === 0 && <div className="px-space-sm py-3 text-center text-onyx-outline">Belum ada transaksi.</div>}
        {recent.map((t, i) => {
          const isNew = !seenIdsRef.current.has(t.id ?? String(i));
          return (
            <div
              key={t.id ?? i}
              className={`flex items-center justify-between bg-onyx-surface-low px-space-sm py-0.5 ${isNew ? "animate-rowIn" : ""}`}
            >
              <span className="text-onyx-on-surface-variant">
                {new Date(t.executed_at).toLocaleTimeString("id-ID", { hour12: false })}
              </span>
              <span className="font-bold text-onyx-primary">{t.price.toLocaleString("id-ID")}</span>
              <span className="text-onyx-on-surface">{t.quantity.toLocaleString("id-ID")}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
