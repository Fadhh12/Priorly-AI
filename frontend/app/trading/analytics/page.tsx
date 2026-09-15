"use client";

import { useEffect, useRef, useState } from "react";
import { getEngineStats, getTrades, type EngineStats, type OrderStatus, type Trade } from "@/lib/api";

const POLL_INTERVAL_MS = 2000;
const PULSE_MS = 600;

const STATUS_ORDER: OrderStatus[] = ["OPEN", "PARTIALLY_FILLED", "FILLED", "CANCELLED"];
const STATUS_LABELS: Record<OrderStatus, string> = {
  OPEN: "Open",
  PARTIALLY_FILLED: "Partial",
  FILLED: "Filled",
  CANCELLED: "Cancelled",
};
const STATUS_COLORS: Record<OrderStatus, string> = {
  OPEN: "#ffb95f",
  PARTIALLY_FILLED: "#e0e2ec",
  FILLED: "#00ff66",
  CANCELLED: "#ffb2b7",
};

/** Formats a real uptime duration (`uptime_seconds` from the store's process
 * start) as e.g. "2h 14m" — no simulated clock, just Date arithmetic. */
function formatUptime(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

type StatTileProps = {
  label: string;
  value: string;
  unit?: string;
  sublabel?: string;
  subvalue?: string;
  accent?: "primary" | "tertiary" | "secondary" | "default";
  /** Pulses the corner dot in neon green — reserved for metrics that are
   * genuinely ticking in real time (uptime, live throughput, WS connections),
   * not decorative on every tile. */
  live?: boolean;
  /** Transient brightness pulse on the value itself — set true for exactly
   * PULSE_MS right after a poll actually changed this number. */
  pulse?: boolean;
};

function StatTile({ label, value, unit, sublabel, subvalue, accent = "default", live = false, pulse = false }: StatTileProps) {
  const accentClass =
    accent === "primary"
      ? "text-onyx-primary"
      : accent === "tertiary"
        ? "text-onyx-tertiary"
        : accent === "secondary"
          ? "text-onyx-secondary"
          : "text-onyx-on-surface";
  return (
    <div className="flex flex-col justify-between bg-onyx-surface-low p-space-md shadow-sm">
      <div className="mb-space-xs flex items-center justify-between">
        <span className="font-label-sm text-label-sm uppercase tracking-wider text-onyx-outline">{label}</span>
        <span className={`h-1.5 w-1.5 bg-onyx-neon ${live ? "animate-pulse" : ""}`} />
      </div>
      <div className="flex flex-col">
        <div className="flex items-baseline gap-space-xs">
          <span className={`font-data-lg text-data-lg font-bold ${accentClass} ${pulse ? "animate-barPulse" : ""}`}>{value}</span>
          {unit && <span className="font-label-sm text-label-sm text-onyx-on-surface-variant">{unit}</span>}
        </div>
        {sublabel && (
          <div className="mt-space-xs flex items-center justify-between font-data-sm text-data-sm text-onyx-on-surface-variant">
            <span>{sublabel}</span>
            {subvalue && <span className="font-semibold text-onyx-on-surface">{subvalue}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

/** Real bar chart of orders_by_status — inline SVG, no chart library, driven
 * entirely by the /engine/stats response (same convention as CandleChart /
 * DonutChart). Default "xMidYMid meet" scaling is used (not "none") so the
 * <text> labels never get non-uniformly stretched. */
function OrdersByStatusChart({ data, pulseKeys }: { data: Record<OrderStatus, number>; pulseKeys: Set<string> }) {
  const width = 400;
  const height = 190;
  const plotHeight = 140;
  const values = STATUS_ORDER.map((s) => data[s] ?? 0);
  const max = Math.max(...values, 1);
  const gap = 28;
  const barWidth = (width - gap * (STATUS_ORDER.length + 1)) / STATUS_ORDER.length;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full">
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={0} x2={width} y1={plotHeight * f} y2={plotHeight * f} stroke="#3c4a42" strokeOpacity={0.3} strokeDasharray="2 3" />
      ))}
      {STATUS_ORDER.map((status, i) => {
        const v = data[status] ?? 0;
        const barHeight = max > 0 ? (v / max) * (plotHeight - 8) : 0;
        const x = gap + i * (barWidth + gap);
        const y = plotHeight - barHeight;
        return (
          <g key={status}>
            <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="12" fill="#e0e2ec" fontWeight={600} style={{ transition: "y 500ms ease" }}>
              {v}
            </text>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(1, barHeight)}
              fill={STATUS_COLORS[status]}
              className={pulseKeys.has(status) ? "animate-barPulse" : ""}
              style={{ transition: "height 500ms ease, y 500ms ease" }}
            />
            <text x={x + barWidth / 2} y={plotHeight + 20} textAnchor="middle" fontSize="10" fill="#86948a">
              {STATUS_LABELS[status]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Real bar chart of orders_by_symbol — up to 10 symbols, one bar each,
 * heights proportional to the real per-symbol order count from the store. */
function OrdersBySymbolChart({ data, pulseKeys }: { data: Record<string, number>; pulseKeys: Set<string> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const width = 560;
  const height = 190;
  const plotHeight = 140;
  const max = Math.max(...entries.map(([, v]) => v), 1);
  const gap = entries.length > 0 ? 10 : 0;
  const barWidth = entries.length > 0 ? (width - gap * (entries.length + 1)) / entries.length : 0;

  if (entries.length === 0) {
    return <div className="flex h-44 w-full items-center justify-center text-body-md text-onyx-outline">Belum ada order.</div>;
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full">
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={0} x2={width} y1={plotHeight * f} y2={plotHeight * f} stroke="#3c4a42" strokeOpacity={0.3} strokeDasharray="2 3" />
      ))}
      {entries.map(([symbol, v], i) => {
        const barHeight = max > 0 ? (v / max) * (plotHeight - 8) : 0;
        const x = gap + i * (barWidth + gap);
        const y = plotHeight - barHeight;
        return (
          <g key={symbol}>
            <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="11" fill="#e0e2ec" fontWeight={600} style={{ transition: "y 500ms ease" }}>
              {v}
            </text>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(1, barHeight)}
              fill="#00ff66"
              className={pulseKeys.has(symbol) ? "animate-barPulse" : ""}
              style={{ transition: "height 500ms ease, y 500ms ease" }}
            />
            <text x={x + barWidth / 2} y={plotHeight + 20} textAnchor="middle" fontSize="9" fill="#86948a">
              {symbol}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Scalar stat fields worth flashing individually — keyed the same as the
 * `pulseTiles` set below. */
type ScalarKey = "uptime" | "total_orders" | "total_trades" | "throughput" | "ws_connections" | "store_records";

export default function EngineAnalyticsPage() {
  const [stats, setStats] = useState<EngineStats | null>(null);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pulseStatus, setPulseStatus] = useState<Set<string>>(new Set());
  const [pulseSymbol, setPulseSymbol] = useState<Set<string>>(new Set());
  const [pulseTiles, setPulseTiles] = useState<Set<ScalarKey>>(new Set());
  const prevStatsRef = useRef<EngineStats | null>(null);
  const seenTradeIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    let pulseTimer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      try {
        const s = await getEngineStats();
        if (cancelled) return;

        const prev = prevStatsRef.current;
        if (prev) {
          const changedStatus = new Set<string>();
          for (const status of STATUS_ORDER) {
            if (prev.orders_by_status[status] !== s.orders_by_status[status]) changedStatus.add(status);
          }
          const changedSymbol = new Set<string>();
          for (const sym of Object.keys(s.orders_by_symbol)) {
            if (prev.orders_by_symbol[sym] !== s.orders_by_symbol[sym]) changedSymbol.add(sym);
          }
          const changedTiles = new Set<ScalarKey>();
          if (prev.uptime_seconds !== s.uptime_seconds) changedTiles.add("uptime");
          if (prev.total_orders !== s.total_orders) changedTiles.add("total_orders");
          if (prev.total_trades !== s.total_trades) changedTiles.add("total_trades");
          if (prev.trades_last_60s !== s.trades_last_60s) changedTiles.add("throughput");
          if (prev.ws_connections !== s.ws_connections) changedTiles.add("ws_connections");
          if (prev.store_records !== s.store_records) changedTiles.add("store_records");

          if (changedStatus.size > 0 || changedSymbol.size > 0 || changedTiles.size > 0) {
            setPulseStatus(changedStatus);
            setPulseSymbol(changedSymbol);
            setPulseTiles(changedTiles);
            if (pulseTimer) clearTimeout(pulseTimer);
            pulseTimer = setTimeout(() => {
              setPulseStatus(new Set());
              setPulseSymbol(new Set());
              setPulseTiles(new Set());
            }, PULSE_MS);
          }
        }
        prevStatsRef.current = s;

        setStats(s);
        setLastUpdated(Date.now());
        setError(null);

        const symbols = Object.keys(s.orders_by_symbol);
        if (symbols.length > 0) {
          const results = await Promise.all(symbols.map((sym) => getTrades(sym).catch(() => [] as Trade[])));
          if (cancelled) return;
          const merged = results
            .flat()
            .sort((a, b) => (a.executed_at < b.executed_at ? 1 : -1))
            .slice(0, 8);
          setRecentTrades(merged);
        }
      } catch {
        if (!cancelled) setError("Gagal memuat /engine/stats dari backend.");
      }
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
      if (pulseTimer) clearTimeout(pulseTimer);
    };
  }, []);

  useEffect(() => {
    seenTradeIdsRef.current = new Set(recentTrades.map((t) => t.id));
  }, [recentTrades]);

  const throughputPerSec = stats ? stats.trades_last_60s / 60 : 0;

  return (
    <div className="flex w-full flex-col gap-space-md">
      {/* Sub-header */}
      <div className="flex flex-col items-start justify-between gap-space-sm bg-onyx-surface-low px-space-md py-space-sm shadow-sm md:flex-row md:items-center">
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-space-xs">
            <span className="h-2 w-2 bg-onyx-primary" />
            <span className="font-headline-sm text-headline-sm uppercase tracking-tight text-onyx-on-surface">
              Engine Telemetry &amp; Performance Core
            </span>
          </div>
          <div className="hidden items-center gap-space-xs bg-onyx-surface-container px-space-sm py-0.5 font-label-sm text-label-sm text-onyx-on-surface-variant sm:flex">
            <span>DATA: IN-MEMORY STORE</span>
            <span className="text-onyx-outline">/</span>
            <span className="font-bold text-onyx-primary">REAL COUNTS ONLY</span>
          </div>
        </div>
        <div className="flex items-center gap-space-sm self-stretch justify-end md:self-auto">
          <div className="flex items-center gap-space-xs bg-onyx-surface-lowest px-space-sm py-space-xs font-label-sm text-label-sm text-onyx-on-surface-variant">
            <span className={`h-1.5 w-1.5 ${error ? "bg-onyx-secondary" : "animate-pulse bg-onyx-primary"}`} />
            <span>AUTO-REFRESH: {POLL_INTERVAL_MS / 1000}S</span>
          </div>
          {lastUpdated && (
            <span className="font-data-sm text-data-sm text-onyx-outline">
              Update: {new Date(lastUpdated).toLocaleTimeString("id-ID", { hour12: false })}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-onyx-secondary-container/20 px-space-md py-space-sm font-body-sm text-body-sm text-onyx-secondary">{error}</div>
      )}

      {/* Bento stat tiles */}
      <div className="grid grid-cols-2 gap-space-xs md:grid-cols-3 xl:grid-cols-6">
        <StatTile
          label="Uptime Engine"
          value={stats ? formatUptime(stats.uptime_seconds) : "—"}
          sublabel="Sejak Proses Start"
          accent="primary"
          live
          pulse={pulseTiles.has("uptime")}
        />
        <StatTile
          label="Total Order"
          value={stats ? stats.total_orders.toLocaleString("id-ID") : "—"}
          sublabel="Order Diterima Engine"
          pulse={pulseTiles.has("total_orders")}
        />
        <StatTile
          label="Total Trade"
          value={stats ? stats.total_trades.toLocaleString("id-ID") : "—"}
          sublabel="Order Tereksekusi"
          accent="primary"
          pulse={pulseTiles.has("total_trades")}
        />
        <StatTile
          label="Trades/detik (60 detik terakhir)"
          value={stats ? throughputPerSec.toFixed(2) : "—"}
          unit="trade/s"
          sublabel="Trade 60 Detik Terakhir"
          subvalue={stats ? stats.trades_last_60s.toLocaleString("id-ID") : "—"}
          live
          pulse={pulseTiles.has("throughput")}
        />
        <StatTile
          label="WS Connections"
          value={stats ? stats.ws_connections.toLocaleString("id-ID") : "—"}
          sublabel="Klien Terhubung"
          accent={stats && stats.ws_connections > 0 ? "primary" : "default"}
          live={!!stats && stats.ws_connections > 0}
          pulse={pulseTiles.has("ws_connections")}
        />
        <StatTile
          label="Store Records"
          value={stats ? stats.store_records.toLocaleString("id-ID") : "—"}
          sublabel="Orders + Trades + Traders"
          pulse={pulseTiles.has("store_records")}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-space-md lg:grid-cols-12">
        <div className="flex flex-col bg-onyx-surface-low p-space-md shadow-sm lg:col-span-5">
          <div className="mb-space-sm flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[16px] text-onyx-tertiary">analytics</span>
            <span className="font-headline-sm text-headline-sm uppercase tracking-tight text-onyx-on-surface">
              Order Berdasarkan Status
            </span>
          </div>
          <div className="bg-onyx-surface-lowest p-space-md">
            {stats ? <OrdersByStatusChart data={stats.orders_by_status} pulseKeys={pulseStatus} /> : <div className="h-44" />}
          </div>
        </div>

        <div className="flex flex-col bg-onyx-surface-low p-space-md shadow-sm lg:col-span-7">
          <div className="mb-space-sm flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[16px] text-onyx-primary">bar_chart</span>
            <span className="font-headline-sm text-headline-sm uppercase tracking-tight text-onyx-on-surface">
              Order Berdasarkan Simbol
            </span>
          </div>
          <div className="bg-onyx-surface-lowest p-space-md">
            {stats ? <OrdersBySymbolChart data={stats.orders_by_symbol} pulseKeys={pulseSymbol} /> : <div className="h-44" />}
          </div>
        </div>
      </div>

      {/* System config + real recent activity */}
      <div className="grid grid-cols-1 gap-space-md lg:grid-cols-12">
        <div className="flex flex-col bg-onyx-surface-low p-space-md shadow-sm lg:col-span-5">
          <div className="mb-space-sm flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[16px] text-onyx-outline">tune</span>
              <span className="font-headline-sm text-headline-sm uppercase tracking-tight text-onyx-on-surface">System Config</span>
            </div>
            <span className="bg-onyx-surface-container px-space-xs py-0.5 font-label-sm text-label-sm uppercase text-onyx-on-surface-variant">
              Read-Only
            </span>
          </div>
          <div className="flex flex-col divide-y divide-onyx-outline-variant/20 bg-onyx-surface-lowest">
            <div className="flex flex-col gap-space-xs px-space-md py-space-sm">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-onyx-outline">Matching Mode</span>
              <span className="font-data-md text-data-md text-onyx-primary">{stats?.matching_mode ?? "—"}</span>
            </div>
            <div className="flex flex-col gap-space-xs px-space-md py-space-sm">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-onyx-outline">Self-Match Rule</span>
              <span className="font-data-sm text-data-sm leading-relaxed text-onyx-on-surface">{stats?.self_match_rule ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between px-space-md py-space-sm">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-onyx-outline">Order Book Depth</span>
              <span className="font-data-md text-data-md text-onyx-on-surface">{stats?.order_book_depth ?? "—"} level</span>
            </div>
            <div className="flex items-center justify-between px-space-md py-space-sm">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-onyx-outline">Simbol Dilacak</span>
              <span className="font-data-md text-data-md text-onyx-on-surface">{stats?.symbols_tracked ?? "—"}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col bg-onyx-surface-low p-space-md shadow-sm lg:col-span-7">
          <div className="mb-space-sm flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="h-2 w-2 animate-pulse bg-onyx-primary" />
              <span className="font-headline-sm text-headline-sm uppercase tracking-tight text-onyx-on-surface">
                Aktivitas Trade Terkini
              </span>
            </div>
            <span className="bg-onyx-surface-container px-space-xs py-0.5 font-label-sm text-label-sm uppercase text-onyx-on-surface-variant">
              GET /trades/:symbol
            </span>
          </div>
          <div className="flex h-80 flex-col gap-space-xs overflow-y-auto bg-onyx-surface-lowest p-space-md font-data-sm text-data-sm">
            {recentTrades.length === 0 && (
              <div className="flex h-full items-center justify-center text-onyx-outline">Belum ada trade tereksekusi.</div>
            )}
            {recentTrades.map((t) => {
              const isNew = !seenTradeIdsRef.current.has(t.id);
              return (
                <div
                  key={t.id}
                  className={`flex items-center justify-between gap-space-sm border-b border-onyx-outline-variant/10 pb-space-xs ${
                    isNew ? "animate-rowIn" : ""
                  }`}
                >
                  <span className="text-onyx-outline">{new Date(t.executed_at).toLocaleTimeString("id-ID", { hour12: false })}</span>
                  <span className="font-semibold text-onyx-on-surface">{t.symbol}</span>
                  <span className="font-bold text-onyx-primary">{t.price.toLocaleString("id-ID")}</span>
                  <span className="text-onyx-on-surface-variant">{t.quantity.toLocaleString("id-ID")} lot</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
