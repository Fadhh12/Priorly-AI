import type { Instrument } from "@/lib/api";
import { formatIDR, formatPct } from "@/lib/format";

type TickerStripProps = {
  instruments: Instrument[];
};

function TickerItem({ instrument }: { instrument: Instrument }) {
  const positive = instrument.change_pct >= 0;
  return (
    <span className="mx-4 inline-flex items-center gap-2 text-sm">
      <span className="font-semibold text-ink">{instrument.symbol}</span>
      <span className="font-mono font-tabular text-subtle">{formatIDR(instrument.last_price)}</span>
      <span className={`font-mono font-tabular ${positive ? "text-gain" : "text-loss"}`}>
        {formatPct(instrument.change_pct)}
      </span>
    </span>
  );
}

export function TickerStrip({ instruments }: TickerStripProps) {
  if (instruments.length === 0) return null;
  // Duplicate the list so the marquee loop (-50%) seams invisibly.
  const loop = [...instruments, ...instruments];

  return (
    <div className="overflow-hidden border-y border-line bg-surface py-3">
      <div className="flex w-max animate-marquee">
        {loop.map((instrument, i) => (
          <TickerItem key={`${instrument.symbol}-${i}`} instrument={instrument} />
        ))}
      </div>
    </div>
  );
}
