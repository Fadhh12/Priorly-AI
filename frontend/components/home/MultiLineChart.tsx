type Series = {
  label: string;
  color: string;
  values: number[];
};

type MultiLineChartProps = {
  series: Series[];
  width?: number;
  height?: number;
};

/** Normalizes each series to % change from its first point, then plots them on a shared scale. */
export function MultiLineChart({ series, width = 560, height = 220 }: MultiLineChartProps) {
  const usable = series.filter((s) => s.values.length >= 2);
  if (usable.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-xs text-faint">
        Menunggu data candle…
      </div>
    );
  }

  const normalized = usable.map((s) => {
    const base = s.values[0] || 1;
    return s.values.map((v) => ((v - base) / base) * 100);
  });

  const allValues = normalized.flat();
  const min = Math.min(...allValues, 0);
  const max = Math.max(...allValues, 0);
  const range = max - min || 1;
  const padY = 12;
  const plotH = height - padY * 2;

  const paths = normalized.map((values) => {
    const points = values.map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = padY + plotH - ((v - min) / range) * plotH;
      return [x, y] as const;
    });
    return points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  });

  const zeroY = padY + plotH - ((0 - min) / range) * plotH;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" aria-hidden>
        <line x1={0} y1={zeroY} x2={width} y2={zeroY} stroke="currentColor" className="text-line" strokeWidth={1} strokeDasharray="3 4" />
        {paths.map((d, i) => (
          <path key={usable[i].label} d={d} fill="none" stroke={usable[i].color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
        ))}
      </svg>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        {usable.map((s, i) => {
          const last = normalized[i][normalized[i].length - 1];
          return (
            <div key={s.label} className="flex items-center gap-1.5 text-xs">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="font-medium text-ink">{s.label}</span>
              <span className={`font-mono font-tabular ${last >= 0 ? "text-gain" : "text-loss"}`}>
                {last >= 0 ? "+" : ""}
                {last.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
