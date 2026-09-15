"use client";

import { useEffect, useState } from "react";
import { getCandles, type Candle, type Instrument } from "@/lib/api";
import { cardAccents } from "@/lib/designTokens";
import { formatCompact, formatIDR, formatPct } from "@/lib/format";
import { Sparkline } from "./Sparkline";
import { MultiLineChart } from "./MultiLineChart";
import { DonutChart } from "./DonutChart";

type LiveStatus = "loading" | "ready" | "error";

type DashboardPreviewProps = {
  status: LiveStatus;
  instruments: Instrument[];
};

const RANK_ACCENTS = [cardAccents[0], cardAccents[1], cardAccents[2]];
const LINE_COLORS = RANK_ACCENTS;
const DONUT_COLORS = [...RANK_ACCENTS, "#CBD5E1"];

type Tone = "info" | "gain" | "loss" | "amber";

const TILE_TONE: Record<Tone, { text: string; bar: string }> = {
  info: { text: "text-[#2F54EB]", bar: "bg-[#2F54EB]" },
  gain: { text: "text-gain", bar: "bg-[#00AB6B]" },
  loss: { text: "text-loss", bar: "bg-[#FF4D4F]" },
  amber: { text: "text-[#FAAD14]", bar: "bg-[#FAAD14]" },
};

function StatTile({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  const t = TILE_TONE[tone];
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
      <span className={`inline-block h-1.5 w-5 rounded-full ${t.bar}`} />
      <p className="mt-2.5 text-[11px] uppercase tracking-wider text-faint">{label}</p>
      <p className={`mt-1 font-mono text-xl font-bold font-tabular ${t.text}`}>{value}</p>
    </div>
  );
}

export function DashboardPreview({ status, instruments }: DashboardPreviewProps) {
  const [candleMap, setCandleMap] = useState<Record<string, Candle[]>>({});

  useEffect(() => {
    if (instruments.length === 0) return;
    let cancelled = false;

    Promise.allSettled(instruments.map((i) => getCandles(i.symbol))).then((results) => {
      if (cancelled) return;
      const next: Record<string, Candle[]> = {};
      results.forEach((res, idx) => {
        if (res.status === "fulfilled") next[instruments[idx].symbol] = res.value;
      });
      setCandleMap(next);
    });

    return () => {
      cancelled = true;
    };
    // Only re-fetch when the instrument list actually changes shape, not on every price tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instruments.length]);

  const gainers = [...instruments].sort((a, b) => b.change_pct - a.change_pct);
  const topGainers = gainers.slice(0, 3);
  const risingCount = instruments.filter((i) => i.change_pct > 0).length;
  const fallingCount = instruments.filter((i) => i.change_pct < 0).length;

  const totalVolume = Object.values(candleMap).reduce(
    (sum, candles) => sum + candles.reduce((s, c) => s + c.volume, 0),
    0,
  );

  const volumeBySymbol = instruments
    .map((i) => ({
      symbol: i.symbol,
      volume: (candleMap[i.symbol] ?? []).reduce((s, c) => s + c.volume, 0),
    }))
    .sort((a, b) => b.volume - a.volume);

  const topVolume = volumeBySymbol.slice(0, 3);
  const otherVolume = volumeBySymbol.slice(3).reduce((s, v) => s + v.volume, 0);
  const donutSegments = [
    ...topVolume.map((v, i) => ({ label: v.symbol, value: v.volume, color: DONUT_COLORS[i] })),
    ...(otherVolume > 0 ? [{ label: "Lainnya", value: otherVolume, color: DONUT_COLORS[3] }] : []),
  ];

  const lineSeries = topGainers.map((inst, i) => ({
    label: inst.symbol,
    color: LINE_COLORS[i],
    values: (candleMap[inst.symbol] ?? []).map((c) => c.close),
  }));

  return (
    <div className="rounded-2xl border border-line bg-canvas p-5 shadow-[0_20px_45px_-25px_rgba(15,23,42,0.25)] sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-faint">Ringkasan Pasar</p>
          <h3 className="mt-0.5 text-lg font-semibold text-ink">10 Saham Populer</h3>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 font-mono text-[10px] text-faint">
          {status === "ready" && (
            <>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gain" />
              LIVE
            </>
          )}
          {status === "loading" && "MENYAMBUNGKAN…"}
          {status === "error" && "TERPUTUS"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total Volume" value={formatCompact(totalVolume)} tone="info" />
        <StatTile label="Saham Naik" value={`${risingCount}`} tone="gain" />
        <StatTile label="Saham Turun" value={`${fallingCount}`} tone="loss" />
        <StatTile
          label="Top Gainer"
          value={topGainers[0] ? formatPct(topGainers[0].change_pct) : "—"}
          tone="amber"
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {topGainers.length > 0
          ? topGainers.map((inst, i) => (
              <div
                key={inst.symbol}
                className="relative overflow-hidden rounded-xl border border-line bg-surface p-4 shadow-sm"
              >
                <span
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ backgroundColor: RANK_ACCENTS[i] }}
                  aria-hidden
                />
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">{inst.symbol}</p>
                    <p className="truncate text-[11px] text-faint">{inst.name}</p>
                  </div>
                  <span className="rounded-full bg-[#D3EBDE] px-2 py-0.5 font-mono text-[11px] font-tabular text-gain">
                    {formatPct(inst.change_pct)}
                  </span>
                </div>
                <p className="mt-2 font-mono text-base font-tabular text-ink">{formatIDR(inst.last_price)}</p>
                <div className="mt-1 -mb-1">
                  <Sparkline
                    values={(candleMap[inst.symbol] ?? []).map((c) => c.close)}
                    color={RANK_ACCENTS[i]}
                    height={40}
                  />
                </div>
              </div>
            ))
          : Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[104px] animate-pulse rounded-xl border border-line bg-surface" />
            ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
          <p className="mb-3 text-[11px] uppercase tracking-wider text-faint">Pergerakan Harga — Top Gainers</p>
          <MultiLineChart series={lineSeries} height={180} />
        </div>
        <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
          <p className="mb-3 text-[11px] uppercase tracking-wider text-faint">Volume per Saham</p>
          {donutSegments.length > 0 ? (
            <DonutChart segments={donutSegments} centerLabel="Total" centerValue={formatCompact(totalVolume)} />
          ) : (
            <div className="flex h-[148px] items-center justify-center text-xs text-faint">Menunggu data…</div>
          )}
        </div>
      </div>
    </div>
  );
}
