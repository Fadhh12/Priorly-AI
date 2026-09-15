"use client";

import { useEffect, useRef, useState } from "react";
import type { OrderBook } from "@/lib/api";

type DepthChartProps = {
  book: OrderBook | null;
};

const VIEW_W = 700;
const VIEW_H = 200;
const MID_GAP = 70;

type Point = { x: number; y: number };

function cumulativeSums(levels: { quantity: number }[]): number[] {
  const out: number[] = [];
  let running = 0;
  for (const l of levels) {
    running += l.quantity;
    out.push(running);
  }
  return out;
}

/** Stepped points for the bid side, ordered left (deepest) to right (best,
 * adjacent to the mid gap) so they can be drawn as a single polyline. */
function bidSteps(levels: { quantity: number }[], midX: number, levelWidth: number, scaleY: (v: number) => number): Point[] {
  const cumSum = cumulativeSums(levels);
  const points: Point[] = [];
  for (let i = levels.length - 1; i >= 0; i--) {
    const y = scaleY(cumSum[i]);
    const xFar = midX - (i + 1) * levelWidth;
    const xNear = midX - i * levelWidth;
    points.push({ x: xFar, y }, { x: xNear, y });
  }
  return points;
}

/** Stepped points for the ask side, ordered left (best, adjacent to the mid
 * gap) to right (deepest). */
function askSteps(levels: { quantity: number }[], midX: number, levelWidth: number, scaleY: (v: number) => number): Point[] {
  const cumSum = cumulativeSums(levels);
  const points: Point[] = [];
  for (let i = 0; i < levels.length; i++) {
    const y = scaleY(cumSum[i]);
    const xNear = midX + i * levelWidth;
    const xFar = midX + (i + 1) * levelWidth;
    points.push({ x: xNear, y }, { x: xFar, y });
  }
  return points;
}

function toPointStr(points: Point[]): string {
  return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

const MORPH_MS = 300;

/** Tweens each point's Y value toward `target` over `MORPH_MS` via
 * requestAnimationFrame, so the cumulative depth step-area visibly morphs
 * instead of snapping whenever a new order shifts the book. Falls back to an
 * instant snap when the point count itself changes (level count differs),
 * since interpolating between differently-shaped point sets isn't meaningful. */
function useAnimatedPoints(target: Point[]): Point[] {
  const [display, setDisplay] = useState<Point[]>(target);
  const fromRef = useRef<Point[]>(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    if (from.length !== target.length) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      setDisplay(target);
      fromRef.current = target;
      return;
    }

    const start = performance.now();
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    function tick(now: number) {
      const t = Math.min(1, (now - start) / MORPH_MS);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from.map((p, i) => ({ x: target[i].x, y: p.y + (target[i].y - p.y) * eased })));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // Re-run whenever the target point values change (new order book snapshot).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(target)]);

  return display;
}

/** Cumulative market depth (stepped area) chart, built entirely from the
 * real aggregated `OrderBook.bids`/`asks` levels (GET /orderbook/{symbol}) —
 * no per-order counts, lot sizes, or fabricated liquidity clusters, since
 * the backend only exposes aggregated price+quantity per level. */
export function DepthChart({ book }: DepthChartProps) {
  const bids = book?.bids ?? [];
  const asks = book?.asks ?? [];
  const isEmpty = bids.length === 0 && asks.length === 0;

  const midX = VIEW_W / 2;
  const halfWidth = (VIEW_W - MID_GAP) / 2;
  const bidLevelWidth = halfWidth / Math.max(bids.length, 1);
  const askLevelWidth = halfWidth / Math.max(asks.length, 1);

  const bidTotal = bids.reduce((s, l) => s + l.quantity, 0);
  const askTotal = asks.reduce((s, l) => s + l.quantity, 0);
  const maxCum = Math.max(bidTotal, askTotal, 1);
  const scaleY = (v: number) => VIEW_H - (v / maxCum) * VIEW_H;
  const yBase = VIEW_H;

  const targetBidPts = bidSteps(bids, midX - MID_GAP / 2, bidLevelWidth, scaleY);
  const targetAskPts = askSteps(asks, midX + MID_GAP / 2, askLevelWidth, scaleY);
  // Hooks run unconditionally every render (even while `isEmpty`) — only the
  // JSX below branches on it — so the morph animation stays correctly wired
  // across renders where the book snapshot goes from empty to populated.
  const bidPts = useAnimatedPoints(targetBidPts);
  const askPts = useAnimatedPoints(targetAskPts);

  // Brief neon glow on the whole depth trace whenever a real orderbook_update
  // WS frame actually changes the book — same "just happened" cue as the
  // order-book row flash, but for the aggregate depth view.
  const [glowing, setGlowing] = useState(false);
  const prevSnapshotRef = useRef<string>("");
  useEffect(() => {
    const snapshot = JSON.stringify({ bids, asks });
    if (prevSnapshotRef.current && prevSnapshotRef.current !== snapshot) {
      setGlowing(true);
      const timer = setTimeout(() => setGlowing(false), 700);
      prevSnapshotRef.current = snapshot;
      return () => clearTimeout(timer);
    }
    prevSnapshotRef.current = snapshot;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book]);

  if (isEmpty) {
    return (
      <div className="flex h-56 w-full items-center justify-center font-body-md text-body-md text-onyx-outline">
        Order book kosong.
      </div>
    );
  }

  const bidPolygon =
    bidPts.length > 0
      ? `${bidPts[0].x.toFixed(1)},${yBase} ${toPointStr(bidPts)} ${(midX - MID_GAP / 2).toFixed(1)},${yBase}`
      : "";
  const askPolygon =
    askPts.length > 0
      ? `${(midX + MID_GAP / 2).toFixed(1)},${yBase} ${toPointStr(askPts)} ${askPts[askPts.length - 1].x.toFixed(1)},${yBase}`
      : "";

  const bestBid = bids[0]?.price ?? null;
  const bestAsk = asks[0]?.price ?? null;
  const deepestBid = bids[bids.length - 1]?.price ?? null;
  const deepestAsk = asks[asks.length - 1]?.price ?? null;
  const spread = bestBid !== null && bestAsk !== null ? bestAsk - bestBid : null;

  return (
    <div className="flex w-full flex-col gap-space-xs">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-[18px] text-onyx-primary">area_chart</span>
          <span className="font-headline-sm text-headline-sm font-semibold uppercase tracking-tight text-onyx-on-surface">
            Kedalaman Pasar Kumulatif
          </span>
          <span className="font-label-sm text-label-sm text-onyx-outline">L2 AGGREGATED</span>
        </div>
        <div className="flex items-center gap-space-md font-data-sm text-data-sm">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 bg-onyx-primary" />
            <span className="text-onyx-on-surface-variant">Bid ({bidTotal.toLocaleString("id-ID")})</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 bg-onyx-secondary-container" />
            <span className="text-onyx-on-surface-variant">Ask ({askTotal.toLocaleString("id-ID")})</span>
          </span>
        </div>
      </div>

      <div className="relative flex h-56 w-full flex-col justify-between overflow-hidden bg-onyx-surface-low p-space-xs">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-space-sm opacity-20">
          <div className="h-px w-full bg-onyx-outline" />
          <div className="h-px w-full bg-onyx-outline" />
          <div className="h-px w-full bg-onyx-outline" />
        </div>

        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="none" className="h-full w-full">
          <defs>
            <linearGradient id="depthBidGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#00ff66" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#00ff66" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="depthAskGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#b50036" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#b50036" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {bidPolygon && <polygon fill="url(#depthBidGradient)" points={bidPolygon} style={{ transition: "opacity 200ms" }} />}
          {bidPts.length > 0 && (
            <polyline
              fill="none"
              points={toPointStr(bidPts)}
              stroke="#00ff66"
              strokeWidth={2}
              className={glowing ? "animate-glowPulse" : ""}
            />
          )}
          {askPolygon && <polygon fill="url(#depthAskGradient)" points={askPolygon} style={{ transition: "opacity 200ms" }} />}
          {askPts.length > 0 && (
            <polyline
              fill="none"
              points={toPointStr(askPts)}
              stroke="#ffb2b7"
              strokeWidth={2}
              className={glowing ? "animate-glowPulse" : ""}
            />
          )}
          {bidPts.length > 0 && <circle cx={bidPts[bidPts.length - 1].x} cy={bidPts[bidPts.length - 1].y} r={3.5} fill="#00ff66" />}
          {askPts.length > 0 && <circle cx={askPts[0].x} cy={askPts[0].y} r={3.5} fill="#ffb2b7" />}
        </svg>

        <div className="absolute inset-x-0 top-0 bottom-6 left-1/2 flex w-16 -translate-x-1/2 flex-col items-center justify-center">
          <div className="h-full w-px bg-onyx-tertiary/70" />
          {spread !== null && (
            <span className="absolute top-2 bg-onyx-surface-lowest px-1 font-label-sm text-label-sm font-bold text-onyx-tertiary">
              Rp {spread.toLocaleString("id-ID")} SPREAD
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-between font-data-sm text-data-sm text-onyx-outline">
        <span>{deepestBid !== null ? deepestBid.toLocaleString("id-ID") : "—"}</span>
        <span className="font-semibold text-onyx-primary">{bestBid !== null ? `${bestBid.toLocaleString("id-ID")} (Bid)` : "—"}</span>
        <span className="text-onyx-tertiary">| Spread |</span>
        <span className="font-semibold text-onyx-secondary">{bestAsk !== null ? `${bestAsk.toLocaleString("id-ID")} (Ask)` : "—"}</span>
        <span>{deepestAsk !== null ? deepestAsk.toLocaleString("id-ID") : "—"}</span>
      </div>
    </div>
  );
}
