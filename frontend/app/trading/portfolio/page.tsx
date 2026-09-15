"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ApiRequestError,
  cancelOrder,
  getInstruments,
  getOrdersForTrader,
  getTrades,
  getTrader,
  type Instrument,
  type Order,
  type Trade,
} from "@/lib/api";
import { formatIDR, formatPct } from "@/lib/format";
import { getTraderId } from "@/lib/trader";
import { useWebSocket } from "@/lib/useWebSocket";

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

const ALLOC_COLORS = ["bg-onyx-primary", "bg-onyx-tertiary", "bg-onyx-secondary", "bg-onyx-outline"];

type OrderFilter = "ALL" | "OPEN" | "DONE";

/** A trade this trader took part in, with the side it traded resolved by
 * matching buy_order_id/sell_order_id against this trader's own orders
 * (Trade itself carries no trader_id — see MyOrdersPanel for the same pattern). */
type MyTrade = Trade & { side: "BUY" | "SELL" | null };

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { hour12: false });
}

export default function PortfolioHistoryPage() {
  const [traderId, setTraderId] = useState("");
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [myTrades, setMyTrades] = useState<MyTrade[]>([]);
  const [cashBalance, setCashBalance] = useState<number | null>(null);
  const [positions, setPositions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("ALL");

  useEffect(() => {
    setTraderId(getTraderId());
  }, []);

  useEffect(() => {
    getInstruments().then(setInstruments).catch(() => {});
  }, []);

  useEffect(() => {
    const id = getTraderId();
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [myOrders, trader] = await Promise.all([getOrdersForTrader(id), getTrader(id)]);
      if (cancelled) return;

      setOrders([...myOrders].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)));
      setCashBalance(trader.cash_balance);
      setPositions(trader.positions);

      const ownOrdersById = new Map(myOrders.map((o) => [o.id, o]));
      const symbols = Array.from(new Set(myOrders.map((o) => o.symbol)));
      const tradesPerSymbol = await Promise.all(symbols.map((s) => getTrades(s).catch(() => [] as Trade[])));
      if (cancelled) return;

      const mine: MyTrade[] = tradesPerSymbol
        .flat()
        .filter((t) => ownOrdersById.has(t.buy_order_id) || ownOrdersById.has(t.sell_order_id))
        .map((t) => {
          const side: "BUY" | "SELL" | null = ownOrdersById.has(t.buy_order_id)
            ? "BUY"
            : ownOrdersById.has(t.sell_order_id)
              ? "SELL"
              : null;
          return { ...t, side };
        })
        .sort((a, b) => (a.executed_at < b.executed_at ? 1 : -1));

      setMyTrades(mine);
      setLoading(false);
    }

    load().catch(() => setLoading(false));
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
    },
    setWsConnected,
  );

  async function handleCancel(orderId: string) {
    try {
      await cancelOrder(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "CANCELLED" } : o)));
    } catch (e) {
      alert(e instanceof ApiRequestError ? e.message : "Gagal membatalkan order");
    }
  }

  const openPositions = useMemo(
    () =>
      Object.entries(positions)
        .filter(([, qty]) => qty > 0)
        .map(([symbol, qty]) => {
          const instrument = instruments.find((i) => i.symbol === symbol);
          const price = instrument?.last_price ?? 0;
          return { symbol, name: instrument?.name ?? symbol, qty, price, marketValue: qty * price };
        })
        .sort((a, b) => b.marketValue - a.marketValue),
    [positions, instruments],
  );

  const positionsValue = openPositions.reduce((sum, p) => sum + p.marketValue, 0);
  const portfolioValue = cashBalance !== null ? cashBalance + positionsValue : null;
  const openOrdersCount = orders.filter((o) => o.status === "OPEN" || o.status === "PARTIALLY_FILLED").length;

  const visibleOrders = orders.filter((o) => {
    if (orderFilter === "ALL") return true;
    if (orderFilter === "OPEN") return o.status === "OPEN" || o.status === "PARTIALLY_FILLED";
    return o.status === "FILLED" || o.status === "CANCELLED";
  });

  return (
    <div className="flex w-full flex-col gap-space-md">
      {/* Telemetry ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm bg-onyx-surface-lowest px-space-md py-space-xs shadow-sm">
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-space-xs">
            <span className="h-1.5 w-1.5 bg-onyx-primary" />
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-onyx-on-surface-variant">
              Portfolio &amp; History
            </span>
          </div>
          {traderId && (
            <span className="font-data-sm text-data-sm text-onyx-outline">
              TRADER: <span className="text-onyx-on-surface-variant">{traderId}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-space-sm">
          <div className="flex items-center gap-space-xs bg-onyx-surface-container px-space-sm py-1">
            <span className={`h-2 w-2 ${wsConnected ? "animate-pulse bg-onyx-primary" : "bg-onyx-secondary"}`} />
            <span className="font-label-sm text-label-sm uppercase text-onyx-primary">{wsConnected ? "Live" : "Terputus"}</span>
          </div>
          <Link
            href="/trading"
            className="flex items-center gap-space-xs bg-onyx-surface-container px-space-sm py-1 font-label-sm text-label-sm uppercase text-onyx-on-surface-variant hover:bg-onyx-surface-high hover:text-onyx-on-surface"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
            Order Baru
          </Link>
        </div>
      </div>

      {/* KPI summary cards */}
      <section className="grid grid-cols-1 gap-gutter sm:grid-cols-3">
        <div className="flex flex-col justify-between bg-onyx-surface-low p-space-md">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-onyx-outline">Cash Balance</span>
            <span className="material-symbols-outlined text-[16px] text-onyx-tertiary">payments</span>
          </div>
          <span className="mt-space-sm font-data-lg text-data-lg font-bold tracking-tight text-onyx-on-surface">
            {cashBalance !== null ? `Rp ${formatIDR(cashBalance)}` : "—"}
          </span>
        </div>
        <div className="flex flex-col justify-between bg-onyx-surface-low p-space-md">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-onyx-outline">
              Portfolio Value (NAV)
            </span>
            <span className="material-symbols-outlined text-[16px] text-onyx-primary">account_balance_wallet</span>
          </div>
          <div className="mt-space-sm flex flex-col">
            <span className="font-data-lg text-data-lg font-bold tracking-tight text-onyx-on-surface">
              {portfolioValue !== null ? `Rp ${formatIDR(portfolioValue)}` : "—"}
            </span>
            <span className="mt-space-xs font-data-sm text-data-sm text-onyx-outline">
              Cash + mark-to-market {openPositions.length} posisi
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-between bg-onyx-surface-low p-space-md">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-onyx-outline">Open Orders</span>
            <span className="material-symbols-outlined text-[16px] text-onyx-tertiary">pending_actions</span>
          </div>
          <span className="mt-space-sm font-data-lg text-data-lg font-bold tracking-tight text-onyx-on-surface">
            {openOrdersCount}
          </span>
        </div>
      </section>

      {/* Positions + allocation */}
      <section className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        <div className="flex flex-col bg-onyx-surface-low lg:col-span-8">
          <div className="flex items-center justify-between bg-onyx-surface-lowest px-space-md py-space-sm">
            <div className="flex items-center gap-space-sm">
              <span className="h-3 w-1.5 bg-onyx-primary" />
              <h2 className="font-headline-sm text-headline-sm uppercase tracking-tight text-onyx-on-surface">
                Portofolio Saham Terbuka
              </h2>
              <span className="font-label-sm text-label-sm bg-onyx-surface-highest px-space-xs py-0.5 text-onyx-on-surface-variant">
                {openPositions.length} POSISI AKTIF
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-data-sm text-data-sm">
              <thead className="bg-onyx-surface-lowest font-label-sm text-label-sm uppercase tracking-wider text-onyx-outline">
                <tr>
                  <th className="px-space-md py-space-xs">Simbol</th>
                  <th className="px-space-sm py-space-xs text-right">Lembar</th>
                  <th className="px-space-sm py-space-xs text-right">Harga Terkini</th>
                  <th className="px-space-sm py-space-xs text-right">Nilai Pasar</th>
                  <th className="px-space-md py-space-xs text-right">Alokasi</th>
                </tr>
              </thead>
              <tbody>
                {!loading && openPositions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-space-md py-3 text-center text-onyx-outline">
                      Belum punya posisi saham.
                    </td>
                  </tr>
                )}
                {openPositions.map((p, i) => {
                  const weight = portfolioValue && portfolioValue > 0 ? (p.marketValue / portfolioValue) * 100 : 0;
                  return (
                    <tr
                      key={p.symbol}
                      className={i % 2 === 0 ? "bg-onyx-surface-low" : "bg-onyx-surface-container"}
                    >
                      <td className="flex items-center gap-space-xs px-space-md py-space-sm font-semibold text-onyx-on-surface">
                        <span className={`h-1.5 w-1.5 ${ALLOC_COLORS[i % ALLOC_COLORS.length]}`} />
                        <span>{p.symbol}</span>
                        <span className="font-label-sm text-label-sm text-onyx-outline">{p.name}</span>
                      </td>
                      <td className="px-space-sm py-space-sm text-right font-medium text-onyx-on-surface">
                        {formatIDR(p.qty)}
                      </td>
                      <td className="px-space-sm py-space-sm text-right font-bold text-onyx-primary">
                        {formatIDR(p.price)}
                      </td>
                      <td className="px-space-sm py-space-sm text-right text-onyx-on-surface">
                        Rp {formatIDR(p.marketValue)}
                      </td>
                      <td className="px-space-md py-space-sm text-right">
                        <div className="flex items-center justify-end gap-space-xs">
                          <span className="text-onyx-on-surface">{weight.toFixed(1)}%</span>
                          <div className="h-1.5 w-10 overflow-hidden bg-onyx-surface-highest">
                            <div
                              className={`h-full ${ALLOC_COLORS[i % ALLOC_COLORS.length]}`}
                              style={{ width: `${Math.min(weight, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {openPositions.length > 0 && (
                <tfoot className="bg-onyx-surface-lowest font-data-sm text-data-sm">
                  <tr>
                    <td className="px-space-md py-space-sm font-bold uppercase text-onyx-outline">Total Posisi</td>
                    <td className="px-space-sm py-space-sm" />
                    <td className="px-space-sm py-space-sm text-right text-onyx-outline">Ekuitas Aktif</td>
                    <td className="px-space-sm py-space-sm text-right font-bold text-onyx-on-surface">
                      Rp {formatIDR(positionsValue)}
                    </td>
                    <td className="px-space-md py-space-sm" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Allocation legend */}
        <div className="flex flex-col bg-onyx-surface-low p-space-md lg:col-span-4">
          <div className="flex items-center gap-space-xs">
            <span className="h-3 w-1.5 bg-onyx-tertiary" />
            <span className="font-headline-sm text-headline-sm uppercase tracking-tight text-onyx-on-surface">
              Alokasi Aset
            </span>
          </div>
          <div className="mt-space-sm flex flex-col gap-space-xs font-data-sm text-data-sm">
            <div className="flex items-center justify-between">
              <span className="text-onyx-on-surface-variant">Cash</span>
              <span className="font-semibold text-onyx-on-surface">
                {portfolioValue && portfolioValue > 0
                  ? `${(((cashBalance ?? 0) / portfolioValue) * 100).toFixed(1)}%`
                  : "—"}{" "}
                <span className="font-normal text-onyx-outline">
                  {cashBalance !== null ? `Rp ${formatIDR(cashBalance)}` : ""}
                </span>
              </span>
            </div>
            {openPositions.map((p, i) => {
              const weight = portfolioValue && portfolioValue > 0 ? (p.marketValue / portfolioValue) * 100 : 0;
              return (
                <div key={p.symbol} className="flex items-center justify-between">
                  <span className="flex items-center gap-space-xs text-onyx-on-surface">
                    <span className={`h-2 w-2 ${ALLOC_COLORS[i % ALLOC_COLORS.length]}`} />
                    <span>{p.symbol}</span>
                  </span>
                  <span className="font-semibold text-onyx-on-surface">
                    {weight.toFixed(1)}% <span className="font-normal text-onyx-outline">Rp {formatIDR(p.marketValue)}</span>
                  </span>
                </div>
              );
            })}
            {openPositions.length === 0 && (
              <span className="py-2 text-center text-onyx-outline">Belum ada alokasi saham.</span>
            )}
          </div>
        </div>
      </section>

      {/* Order history */}
      <section className="flex flex-col bg-onyx-surface-low">
        <div className="flex flex-col gap-space-sm bg-onyx-surface-lowest px-space-md py-space-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-space-sm">
            <span className="h-3 w-1.5 bg-onyx-outline" />
            <h2 className="font-headline-sm text-headline-sm uppercase tracking-tight text-onyx-on-surface">
              Riwayat Order
            </h2>
            <span className="font-label-sm text-label-sm bg-onyx-surface-highest px-space-xs py-0.5 text-onyx-on-surface-variant">
              TOTAL: {orders.length} ORDER
            </span>
          </div>
          <div className="flex items-center bg-onyx-surface-high p-0.5">
            {(["ALL", "OPEN", "DONE"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setOrderFilter(f)}
                className={`px-space-sm py-0.5 font-label-sm text-label-sm uppercase ${
                  orderFilter === f
                    ? "bg-onyx-surface-lowest font-bold text-onyx-primary"
                    : "text-onyx-on-surface-variant hover:text-onyx-on-surface"
                }`}
              >
                {f === "ALL" ? "Semua" : f === "OPEN" ? "Resting" : "Selesai"}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-data-sm text-data-sm">
            <thead className="bg-onyx-surface-lowest font-label-sm text-label-sm uppercase tracking-wider text-onyx-outline">
              <tr>
                <th className="px-space-md py-space-xs">Waktu</th>
                <th className="px-space-sm py-space-xs">Order ID</th>
                <th className="px-space-sm py-space-xs">Emiten</th>
                <th className="px-space-sm py-space-xs">Side</th>
                <th className="px-space-sm py-space-xs text-right">Harga</th>
                <th className="px-space-sm py-space-xs text-right">Qty</th>
                <th className="px-space-sm py-space-xs text-right">Sisa</th>
                <th className="px-space-sm py-space-xs">Status</th>
                <th className="px-space-md py-space-xs text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!loading && visibleOrders.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-space-md py-3 text-center text-onyx-outline">
                    Belum ada order untuk filter ini.
                  </td>
                </tr>
              )}
              {visibleOrders.map((o, i) => (
                <tr key={o.id} className={i % 2 === 0 ? "bg-onyx-surface-low" : "bg-onyx-surface-container"}>
                  <td className="px-space-md py-space-sm text-onyx-outline">{fmtDateTime(o.created_at)}</td>
                  <td className="px-space-sm py-space-sm text-onyx-on-surface-variant">{o.id.slice(0, 8)}</td>
                  <td className="px-space-sm py-space-sm font-bold text-onyx-on-surface">{o.symbol}</td>
                  <td className={`px-space-sm py-space-sm font-semibold ${o.side === "BUY" ? "text-onyx-primary" : "text-onyx-secondary"}`}>
                    {o.side === "BUY" ? "BELI" : "JUAL"}
                  </td>
                  <td className="px-space-sm py-space-sm text-right font-semibold text-onyx-on-surface">
                    {formatIDR(o.price)}
                  </td>
                  <td className="px-space-sm py-space-sm text-right text-onyx-on-surface">{formatIDR(o.quantity)}</td>
                  <td className="px-space-sm py-space-sm text-right text-onyx-on-surface-variant">
                    {formatIDR(o.remaining_quantity)}
                  </td>
                  <td className="px-space-sm py-space-sm">
                    <span className={`px-1.5 py-0.5 font-semibold ${STATUS_CLASS[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                  </td>
                  <td className="px-space-md py-space-sm text-center">
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
        <div className="flex items-center justify-between bg-onyx-surface-lowest px-space-md py-space-sm font-data-sm text-data-sm text-onyx-outline">
          <span>
            Menampilkan {visibleOrders.length} dari {orders.length} order
          </span>
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="flex items-center gap-space-xs bg-onyx-surface-high px-space-sm py-0.5 uppercase text-onyx-on-surface-variant hover:bg-onyx-surface-bright hover:text-onyx-on-surface"
          >
            <span className="material-symbols-outlined text-[14px]">refresh</span>
            Refresh
          </button>
        </div>
      </section>

      {/* Trade history */}
      <section className="flex flex-col bg-onyx-surface-low">
        <div className="flex items-center justify-between bg-onyx-surface-lowest px-space-md py-space-sm">
          <div className="flex items-center gap-space-sm">
            <span className="h-3 w-1.5 bg-onyx-primary" />
            <h2 className="font-headline-sm text-headline-sm uppercase tracking-tight text-onyx-on-surface">
              Riwayat Transaksi
            </h2>
            <span className="font-label-sm text-label-sm bg-onyx-surface-highest px-space-xs py-0.5 text-onyx-on-surface-variant">
              TOTAL: {myTrades.length} EKSEKUSI
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-data-sm text-data-sm">
            <thead className="bg-onyx-surface-lowest font-label-sm text-label-sm uppercase tracking-wider text-onyx-outline">
              <tr>
                <th className="px-space-md py-space-xs">Waktu</th>
                <th className="px-space-sm py-space-xs">ID Transaksi</th>
                <th className="px-space-sm py-space-xs">Emiten</th>
                <th className="px-space-sm py-space-xs">Side</th>
                <th className="px-space-sm py-space-xs text-right">Harga Eksekusi</th>
                <th className="px-space-sm py-space-xs text-right">Qty</th>
                <th className="px-space-md py-space-xs text-right">Nilai Total</th>
              </tr>
            </thead>
            <tbody>
              {!loading && myTrades.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-space-md py-3 text-center text-onyx-outline">
                    Belum ada transaksi.
                  </td>
                </tr>
              )}
              {myTrades.map((t, i) => (
                <tr key={t.id} className={i % 2 === 0 ? "bg-onyx-surface-low" : "bg-onyx-surface-container"}>
                  <td className="px-space-md py-space-sm text-onyx-outline">{fmtDateTime(t.executed_at)}</td>
                  <td className="px-space-sm py-space-sm text-onyx-on-surface-variant">{t.id.slice(0, 8)}</td>
                  <td className="px-space-sm py-space-sm font-bold text-onyx-on-surface">{t.symbol}</td>
                  <td className="px-space-sm py-space-sm">
                    {t.side ? (
                      <span
                        className={`px-1.5 py-0.5 font-semibold ${
                          t.side === "BUY" ? "bg-onyx-primary/10 text-onyx-primary" : "bg-onyx-secondary-container/20 text-onyx-secondary"
                        }`}
                      >
                        {t.side === "BUY" ? "BELI" : "JUAL"}
                      </span>
                    ) : (
                      <span className="text-onyx-outline">—</span>
                    )}
                  </td>
                  <td className="px-space-sm py-space-sm text-right font-semibold text-onyx-on-surface">
                    {formatIDR(t.price)}
                  </td>
                  <td className="px-space-sm py-space-sm text-right text-onyx-on-surface">{formatIDR(t.quantity)}</td>
                  <td className="px-space-md py-space-sm text-right font-semibold text-onyx-on-surface">
                    Rp {formatIDR(t.price * t.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between bg-onyx-surface-lowest px-space-md py-space-sm font-data-sm text-data-sm text-onyx-outline">
          <span>Menampilkan {myTrades.length} transaksi tereksekusi milik trader ini</span>
          <span className="font-label-sm text-label-sm uppercase text-onyx-outline">
            {wsConnected ? "Harga live via WebSocket" : "Harga dari snapshot REST terakhir"}
          </span>
        </div>
      </section>
    </div>
  );
}
