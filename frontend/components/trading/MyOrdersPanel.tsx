"use client";

import { useEffect, useState } from "react";
import {
  ApiRequestError,
  cancelOrder,
  getOrdersForTrader,
  getTrades,
  getTrader,
  type Instrument,
  type Order,
  type Trade,
} from "@/lib/api";
import { getTraderId } from "@/lib/trader";

type Tab = "orders" | "trades" | "portfolio";

const STATUS_LABEL: Record<Order["status"], string> = {
  OPEN: "OPEN",
  PARTIALLY_FILLED: "PARSIAL",
  FILLED: "TERISI",
  CANCELLED: "BATAL",
};

const STATUS_CLASS: Record<Order["status"], string> = {
  OPEN: "bg-onyx-tertiary/10 text-onyx-tertiary",
  PARTIALLY_FILLED: "bg-onyx-primary/10 text-onyx-primary",
  FILLED: "bg-onyx-primary/20 text-onyx-primary",
  CANCELLED: "bg-onyx-secondary-container/20 text-onyx-secondary",
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", { hour12: false });
}

type MyOrdersPanelProps = {
  instruments: Instrument[];
  refreshKey: number;
};

/** Blotter/trade-log/portfolio for the current browser's trader — every row
 * is real: GET /orders/{trader_id}, GET /trades/{symbol} filtered down to
 * this trader's own order ids (no endpoint returns "my trades" directly), and
 * GET /traders/{trader_id} for cash/positions. */
export function MyOrdersPanel({ instruments, refreshKey }: MyOrdersPanelProps) {
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [myTrades, setMyTrades] = useState<Trade[]>([]);
  const [cashBalance, setCashBalance] = useState<number | null>(null);
  const [positions, setPositions] = useState<Record<string, number>>({});

  useEffect(() => {
    const traderId = getTraderId();
    let cancelled = false;

    async function load() {
      const [myOrders, trader] = await Promise.all([getOrdersForTrader(traderId), getTrader(traderId)]);
      if (cancelled) return;
      setOrders([...myOrders].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)));
      setCashBalance(trader.cash_balance);
      setPositions(trader.positions);

      const myOrderIds = new Set(myOrders.map((o) => o.id));
      const symbols = Array.from(new Set(myOrders.map((o) => o.symbol)));
      const tradesPerSymbol = await Promise.all(symbols.map((s) => getTrades(s).catch(() => [] as Trade[])));
      if (cancelled) return;
      const mine = tradesPerSymbol
        .flat()
        .filter((t) => myOrderIds.has(t.buy_order_id) || myOrderIds.has(t.sell_order_id))
        .sort((a, b) => (a.executed_at < b.executed_at ? 1 : -1));
      setMyTrades(mine);
    }

    load().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  async function handleCancel(orderId: string) {
    try {
      await cancelOrder(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "CANCELLED" } : o)));
    } catch (e) {
      alert(e instanceof ApiRequestError ? e.message : "Gagal membatalkan order");
    }
  }

  const restingCount = orders.filter((o) => o.status === "OPEN" || o.status === "PARTIALLY_FILLED").length;
  const portfolioValue =
    cashBalance !== null
      ? cashBalance +
        Object.entries(positions).reduce((sum, [symbol, qty]) => {
          const price = instruments.find((i) => i.symbol === symbol)?.last_price ?? 0;
          return sum + qty * price;
        }, 0)
      : null;

  return (
    <div className="flex flex-col gap-space-xs">
      <div className="flex flex-wrap items-center justify-between gap-space-sm pb-1">
        <div className="flex items-center gap-space-md">
          <button
            type="button"
            onClick={() => setTab("orders")}
            className={`flex items-center gap-space-xs font-label-md text-label-md font-bold uppercase tracking-wider ${
              tab === "orders" ? "text-onyx-primary" : "text-onyx-outline hover:text-onyx-on-surface"
            }`}
          >
            <span className="h-1.5 w-1.5 bg-onyx-primary" />
            Order Saya (Resting: {restingCount})
          </button>
          <button
            type="button"
            onClick={() => setTab("trades")}
            className={`font-label-md text-label-md font-semibold uppercase tracking-wider ${
              tab === "trades" ? "text-onyx-primary" : "text-onyx-outline hover:text-onyx-on-surface"
            }`}
          >
            Riwayat Transaksi
          </button>
          <button
            type="button"
            onClick={() => setTab("portfolio")}
            className={`font-label-md text-label-md font-semibold uppercase tracking-wider ${
              tab === "portfolio" ? "text-onyx-primary" : "text-onyx-outline hover:text-onyx-on-surface"
            }`}
          >
            Portofolio
          </button>
        </div>
      </div>

      {tab === "orders" && (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-data-sm text-data-sm">
            <thead>
              <tr className="bg-onyx-surface-high font-label-sm text-label-sm uppercase text-onyx-outline">
                <th className="px-space-sm py-1">Waktu</th>
                <th className="px-space-sm py-1">Emiten</th>
                <th className="px-space-sm py-1">Side</th>
                <th className="px-space-sm py-1 text-right">Harga</th>
                <th className="px-space-sm py-1 text-right">Qty</th>
                <th className="px-space-sm py-1 text-right">Sisa</th>
                <th className="px-space-sm py-1">Status</th>
                <th className="px-space-sm py-1 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-space-sm py-3 text-center text-onyx-outline">
                    Belum ada order.
                  </td>
                </tr>
              )}
              {orders.map((o, i) => (
                <tr key={o.id} className={i % 2 === 0 ? "bg-onyx-surface-low" : "bg-onyx-surface-container"}>
                  <td className="px-space-sm py-1 text-onyx-on-surface-variant">{fmtTime(o.created_at)}</td>
                  <td className="px-space-sm py-1 font-bold text-onyx-on-surface">{o.symbol}</td>
                  <td className={`px-space-sm py-1 font-semibold ${o.side === "BUY" ? "text-onyx-primary" : "text-onyx-secondary"}`}>
                    {o.side === "BUY" ? "BELI" : "JUAL"}
                  </td>
                  <td className="px-space-sm py-1 text-right font-semibold text-onyx-on-surface">{o.price.toLocaleString("id-ID")}</td>
                  <td className="px-space-sm py-1 text-right text-onyx-on-surface">{o.quantity.toLocaleString("id-ID")}</td>
                  <td className="px-space-sm py-1 text-right text-onyx-on-surface-variant">{o.remaining_quantity.toLocaleString("id-ID")}</td>
                  <td className="px-space-sm py-1">
                    <span className={`px-1.5 py-0.5 font-semibold ${STATUS_CLASS[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                  </td>
                  <td className="px-space-sm py-1 text-center">
                    {(o.status === "OPEN" || o.status === "PARTIALLY_FILLED") && (
                      <button
                        type="button"
                        onClick={() => handleCancel(o.id)}
                        className="bg-onyx-surface-highest px-space-xs py-0.5 font-label-sm text-label-sm uppercase text-onyx-secondary hover:bg-onyx-secondary-container hover:text-onyx-on-secondary"
                      >
                        Batal
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "trades" && (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-data-sm text-data-sm">
            <thead>
              <tr className="bg-onyx-surface-high font-label-sm text-label-sm uppercase text-onyx-outline">
                <th className="px-space-sm py-1">Waktu</th>
                <th className="px-space-sm py-1">Emiten</th>
                <th className="px-space-sm py-1 text-right">Harga</th>
                <th className="px-space-sm py-1 text-right">Qty</th>
              </tr>
            </thead>
            <tbody>
              {myTrades.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-space-sm py-3 text-center text-onyx-outline">
                    Belum ada transaksi.
                  </td>
                </tr>
              )}
              {myTrades.map((t, i) => (
                <tr key={t.id} className={i % 2 === 0 ? "bg-onyx-surface-low" : "bg-onyx-surface-container"}>
                  <td className="px-space-sm py-1 text-onyx-on-surface-variant">{fmtTime(t.executed_at)}</td>
                  <td className="px-space-sm py-1 font-bold text-onyx-on-surface">{t.symbol}</td>
                  <td className="px-space-sm py-1 text-right font-semibold text-onyx-primary">{t.price.toLocaleString("id-ID")}</td>
                  <td className="px-space-sm py-1 text-right text-onyx-on-surface">{t.quantity.toLocaleString("id-ID")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "portfolio" && (
        <div className="flex flex-col gap-space-xs">
          <div className="grid grid-cols-2 gap-space-xs sm:grid-cols-3">
            <div className="bg-onyx-surface-low p-space-sm">
              <p className="font-label-sm text-label-sm uppercase text-onyx-outline">Cash Balance</p>
              <p className="font-data-md text-data-md font-bold text-onyx-on-surface">
                Rp {(cashBalance ?? 0).toLocaleString("id-ID")}
              </p>
            </div>
            <div className="bg-onyx-surface-low p-space-sm">
              <p className="font-label-sm text-label-sm uppercase text-onyx-outline">Nilai Portofolio</p>
              <p className="font-data-md text-data-md font-bold text-onyx-primary">
                Rp {(portfolioValue ?? 0).toLocaleString("id-ID")}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-data-sm text-data-sm">
              <thead>
                <tr className="bg-onyx-surface-high font-label-sm text-label-sm uppercase text-onyx-outline">
                  <th className="px-space-sm py-1">Emiten</th>
                  <th className="px-space-sm py-1 text-right">Lembar</th>
                  <th className="px-space-sm py-1 text-right">Harga Terakhir</th>
                  <th className="px-space-sm py-1 text-right">Nilai Pasar</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(positions).filter(([, qty]) => qty > 0).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-space-sm py-3 text-center text-onyx-outline">
                      Belum punya posisi saham.
                    </td>
                  </tr>
                )}
                {Object.entries(positions)
                  .filter(([, qty]) => qty > 0)
                  .map(([symbol, qty], i) => {
                    const price = instruments.find((ins) => ins.symbol === symbol)?.last_price ?? 0;
                    return (
                      <tr key={symbol} className={i % 2 === 0 ? "bg-onyx-surface-low" : "bg-onyx-surface-container"}>
                        <td className="px-space-sm py-1 font-bold text-onyx-on-surface">{symbol}</td>
                        <td className="px-space-sm py-1 text-right text-onyx-on-surface">{qty.toLocaleString("id-ID")}</td>
                        <td className="px-space-sm py-1 text-right text-onyx-on-surface">{price.toLocaleString("id-ID")}</td>
                        <td className="px-space-sm py-1 text-right font-semibold text-onyx-primary">
                          {(qty * price).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
