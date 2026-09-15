type Segment = {
  label: string;
  value: number;
  color: string;
};

type DonutChartProps = {
  segments: Segment[];
  size?: number;
  centerLabel: string;
  centerValue: string;
};

const STROKE = 16;

export function DonutChart({ segments, size = 148, centerLabel, centerValue }: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const r = (size - STROKE) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let cumulative = 0;

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" className="text-surface-raised" strokeWidth={STROKE} />
        {total > 0 &&
          segments.map((s) => {
            const fraction = s.value / total;
            const dash = fraction * circumference;
            const offset = -(cumulative / total) * circumference;
            cumulative += s.value;
            return (
              <circle
                key={s.label}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={STROKE}
                strokeDasharray={`${dash.toFixed(1)} ${circumference.toFixed(1)}`}
                strokeDashoffset={offset.toFixed(1)}
                transform={`rotate(-90 ${cx} ${cy})`}
                strokeLinecap="butt"
              />
            );
          })}
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-ink text-[15px] font-bold font-mono">
          {centerValue}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="fill-faint text-[9px] uppercase tracking-wider">
          {centerLabel}
        </text>
      </svg>
      <ul className="flex flex-col gap-2">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-subtle">{s.label}</span>
            <span className="font-mono font-tabular text-ink">
              {total > 0 ? ((s.value / total) * 100).toFixed(1) : "0.0"}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
